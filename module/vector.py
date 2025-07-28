import os
import uuid
import asyncio
import asyncpg
import numpy as np
import pandas as pd
import json
import time
from pgvector.asyncpg import register_vector
from langchain_google_vertexai import VertexAIEmbeddings
from langchain_experimental.text_splitter import SemanticChunker
from minio import Minio
from config.config import SaGoogle, GeminiConfig, PgCredential, MinioConfig
from module.multimodal_model import GeminiPDFExtractor

class PostgreDB:
    def __init__(self):
        # Postgres credentials
        self.pg_cred = PgCredential()
        self.host = self.pg_cred.hostname
        self.port = self.pg_cred.port
        self.user = self.pg_cred.username
        self.db_name = self.pg_cred.database
        self.password_db = self.pg_cred.password

        # Initialize GeminiPDFExtractor (handles Vertex AI init)
        self.extractor = GeminiPDFExtractor()
        gemini_config = GeminiConfig()
        self.vertex_location = gemini_config.location
        self.vertex_project = gemini_config.project

        # Initialize MinIO client
        minio_cfg = MinioConfig()
        self.minio_client = Minio(
            minio_cfg.endpoint,
            access_key=minio_cfg.access_key,
            secret_key=minio_cfg.secret_key,
            secure=minio_cfg.secure
        )
        self.bucket_name = minio_cfg.bucket_name
        self.base_url = minio_cfg.base_url.rstrip('/')
        if not self.minio_client.bucket_exists(self.bucket_name):
            self.minio_client.make_bucket(self.bucket_name)

    def retry_with_backoff(self, func, *args, retry_delay=5, backoff_factor=2, **kwargs):
        max_attempts = 10
        retries = 0
        while retries < max_attempts:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                retries += 1
                wait = retry_delay * (backoff_factor ** retries)
                print(f"Error: {e}. Retrying in {wait}s...")
                time.sleep(wait)
        raise RuntimeError(f"Failed after {max_attempts} attempts")

    async def connect_to_db(self):
        return await asyncpg.connect(
            host=self.host,
            port=self.port,
            user=self.user,
            password=self.password_db,
            database=self.db_name,
        )

    async def generateSourceTable(self, df: pd.DataFrame, table_name: str, create_query: str):
        conn = await self.connect_to_db()
        await conn.execute(f"DROP TABLE IF EXISTS {table_name} CASCADE")
        await conn.execute(create_query)
        tuples = [tuple(map(str, t)) for t in df.itertuples(index=False)]
        await conn.copy_records_to_table(
            table_name,
            records=tuples,
            columns=list(df),
            timeout=10
        )
        await conn.close()

    async def generateVectorTable(self, df: pd.DataFrame, table_name: str, create_query: str):
        conn = await self.connect_to_db()
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        await register_vector(conn)
        await conn.execute(f"DROP TABLE IF EXISTS {table_name}_embeddings")
        await conn.execute(create_query)
        for _, row in df.iterrows():
            await conn.execute(
                f"INSERT INTO {table_name}_embeddings (id, content, embedding) VALUES ($1, $2, $3)",
                row["id"], row["content"], np.array(row["embedding"])
            )
        await conn.close()

    async def generateHNSWIndexing(self, table_name: str, m: int, operator: str, ef_construction: int, lists: int):
        conn = await self.connect_to_db()
        await register_vector(conn)
        await conn.execute(
            f"""CREATE INDEX ON {table_name}_embeddings
                USING hnsw(embedding {operator})
                WITH (m = {m}, ef_construction = {ef_construction})
            """
        )
        await conn.close()

    async def dropVectorTable(self, table_name: str):
        conn = await self.connect_to_db()
        await conn.execute(f"DROP TABLE IF EXISTS {table_name}_embeddings")
        await conn.execute(f"DROP TABLE IF EXISTS {table_name} CASCADE")
        await conn.close()

    async def clean_text(self, text: str) -> str:
        import re
        return re.sub(r"[^a-zA-Z0-9\s.,<>=]", "", text)
    
    async def build_table(
        self,
        df: pd.DataFrame,
        table_name: str,
        create_query: str = "",
        vector_query: str = "",
        m: int = 24,
        ef_construction: int = 100,
        lists: int = 2000,
        operator: str = "vector_cosine_ops"
    ):
        # Copy dataframe & add UUID
        df = df.copy().fillna("")
        df["id"] = [str(uuid.uuid4()) for _ in range(len(df))]

        # Upload PDFs to MinIO, extract sections, then delete local files
        df["bucket_name"] = self.bucket_name
        df["link_document"] = ""
        sections = ["latar_belakang", "tujuan_inovasi", "deskripsi_inovasi"]
        
        # Initialize sections in DataFrame if they don't exist
        for sec in sections:
            if sec not in df.columns:
                df[sec] = ""

        for idx, row in df.iterrows():
            pdf_path = row.get("pdf_path")
            if pdf_path:
                # upload to MinIO
                obj_name = f"{table_name}/{row['id']}.pdf"
                self.minio_client.fput_object(self.bucket_name, obj_name, pdf_path)
                df.at[idx, "link_document"] = f"{self.base_url}/{self.bucket_name}/{obj_name}"

                # Extract sections using the improved extractor
                extracted = self.extractor.extract_multiple_sections(pdf_path, sections)
                
                # Handle fallback parsing if needed
                if 'raw_response' in extracted:
                    self._parse_raw_response(extracted, sections, pdf_path)
                
                # Assign extracted sections to dataframe
                for sec in sections:
                    df.at[idx, sec] = extracted.get(sec, "TIDAK DITEMUKAN")
                    print(f"Section {sec}: {extracted.get(sec, 'TIDAK DITEMUKAN')[:100]}...")

                # delete local file
                try:
                    os.remove(pdf_path)
                except Exception as e:
                    print(f"Warning: could not delete file {pdf_path}: {e}")

        # Default create_query with new columns
        if not create_query:
            create_query = f"""
            CREATE TABLE IF NOT {table_name} (
                id VARCHAR(1024) PRIMARY KEY,
                nama_inovasi TEXT,
                bucket_name TEXT,
                link_document TEXT,
                latar_belakang TEXT,
                tujuan_inovasi TEXT,
                deskripsi_inovasi TEXT
            )
            """
        if not vector_query:
            vector_query = f"""
            CREATE TABLE {table_name}_embeddings (
                id VARCHAR(1024) NOT NULL REFERENCES {table_name}(id),
                content TEXT,
                embedding vector(768)
            )
            """

        # *** IMPORTANT FIX: Drop pdf_path column before saving to database ***
        # pdf_path was only needed for processing, not for database storage
        df_for_db = df.drop(columns=['pdf_path'], errors='ignore')
        
        # Save main table and build vectors
        await self.generateSourceTable(df_for_db, table_name, create_query)
        
        vertex_embeddings = VertexAIEmbeddings(
            model_name="textembedding-gecko@003",
            location=self.vertex_location,
            max_output_tokens=768
        )
        text_splitter = SemanticChunker(vertex_embeddings)
        chunks = []
        for _, row in df.iterrows():  # Use original df for processing (still has all columns)
            for sec in sections:
                content = await self.clean_text(row.get(sec, "").lower())
                if content and content != "tidak ditemukan":  # Skip empty or not found content
                    for doc in text_splitter.create_documents([content]):
                        text = doc.page_content.strip()
                        if text:
                            chunks.append({"id": row["id"], "content": text})

        if not chunks:
            print("Warning: No content chunks were created for embedding")
            return "success but no content for embedding"

        for i in range(0, len(chunks), 5):
            batch = [c["content"] for c in chunks[i : i + 5]]
            embs = self.retry_with_backoff(vertex_embeddings.embed_documents, batch)
            for c, e in zip(chunks[i : i + 5], embs):
                c["embedding"] = e

        emb_df = pd.DataFrame(chunks)
        await self.generateVectorTable(emb_df, table_name, vector_query)
        await self.generateHNSWIndexing(table_name, m, operator, ef_construction, lists)

        return "success embedding data"

    def _parse_raw_response(self, extracted: dict, sections: list, pdf_path: str):
        """Helper method to parse raw_response when JSON parsing fails in extractor"""
        import re
        import json
        
        raw_response = extracted.get('raw_response', '')
        
        # Extract JSON from markdown code block if present
        json_match = re.search(r'```json\s*\n(.*?)\n```', raw_response, re.DOTALL)
        if json_match:
            try:
                json_data = json.loads(json_match.group(1))
                # Update extracted with the parsed data
                for sec in sections:
                    if sec in json_data:
                        extracted[sec] = json_data[sec]
                print(f"Successfully parsed JSON from raw_response for {pdf_path}")
                return
            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON from raw_response: {e}")
        
        # Try to find JSON without code block
        try:
            # Look for JSON object in the raw response
            json_start = raw_response.find('{')
            json_end = raw_response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = raw_response[json_start:json_end]
                json_data = json.loads(json_str)
                for sec in sections:
                    if sec in json_data:
                        extracted[sec] = json_data[sec]
                print(f"Successfully parsed JSON from raw text for {pdf_path}")
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON from raw text: {e}")


    async def similarity_search_plagiarisme(
        self,
        prompt: str,
        similarity_threshold: float,
        num_matches: int,
        table_name: str
    ):
        embeddings_service = VertexAIEmbeddings(
            model_name="textembedding-gecko@003",
            location=self.vertex_location,
            max_output_tokens=768
        )
        qe = embeddings_service.embed_query(prompt.lower())

        conn = await self.connect_to_db()
        await register_vector(conn)
        results = await conn.fetch(
            f"""
            WITH vector_matches AS (
                SELECT id, 1 - (embedding <=> $1) AS similarity
                FROM {table_name}_embeddings
                WHERE 1 - (embedding <=> $1) > $2
                ORDER BY similarity DESC
                LIMIT $3
            )
            SELECT
                t.id,
                t.latar_belakang,
                t.tujuan_inovasi,
                t.deskripsi_inovasi,
                t.link_document,
                v.similarity
            FROM {table_name} t
            JOIN vector_matches v ON t.id = v.id
            ORDER BY v.similarity DESC
            """,
            qe, similarity_threshold, num_matches
        )
        await conn.close()
        if not results:
            return {"message": "tidak ada dokumen hasil vector search"}

        return [
            {
                "id": r["id"],
                "latar_belakang": r["latar_belakang"],
                "tujuan_inovasi": r["tujuan_inovasi"],
                "deskripsi_inovasi": r["deskripsi_inovasi"],
                "link_document": r["link_document"],
                "similarity": r["similarity"]
            } for r in results
        ]
