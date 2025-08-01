import os
import uuid
import asyncio
import asyncpg
import numpy as np
import pandas as pd
import json
import time
import logging
from pgvector.asyncpg import register_vector
from langchain_google_vertexai import VertexAIEmbeddings
from langchain_experimental.text_splitter import SemanticChunker
from minio import Minio
from google.oauth2 import service_account
from config.config import SaGoogle, GeminiConfig, PgCredential, MinioConfig
from module.multimodal_model import GeminiPDFExtractor

# Setup logging
logger = logging.getLogger(__name__)

class PostgreDB:
    def __init__(self):
        # Postgres credentials
        self.pg_cred = PgCredential()
        self.host = self.pg_cred.hostname
        self.port = self.pg_cred.port
        self.user = self.pg_cred.username
        self.db_name = self.pg_cred.database
        self.password_db = self.pg_cred.password

        # Setup Google Cloud credentials
        self.credentials = None
        self.setup_google_credentials()

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

    def setup_google_credentials(self):
        """Setup Google Cloud credentials for VertexAI services"""
        try:
            sa = SaGoogle()
            
            if sa.vertex and sa.vertex != '{}':
                try:
                    # Try to parse as JSON content first (for environment variable)
                    json_content = json.loads(sa.vertex)
                    self.credentials = service_account.Credentials.from_service_account_info(
                        json_content,
                        scopes=["https://www.googleapis.com/auth/cloud-platform"]
                    )
                    logger.info("Loaded Google Cloud credentials from JSON content (environment variable)")
                except json.JSONDecodeError:
                    # If not JSON, treat as file path (for local development)
                    self.credentials = service_account.Credentials.from_service_account_file(
                        sa.vertex,  
                        scopes=["https://www.googleapis.com/auth/cloud-platform"]
                    )
                    logger.info("Loaded Google Cloud credentials from file path")
            else:
                logger.warning("No Google Cloud credentials found. VertexAI features may be limited.")
                
        except Exception as e:
            logger.error(f"Failed to setup Google Cloud credentials: {e}")
            self.credentials = None

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
        # Only create table if not exists
        await conn.execute(create_query)
        tuples = [tuple(map(str, t)) for t in df.itertuples(index=False)]
        # Insert or update (upsert) data
        for t in tuples:
            columns = list(df)
            values = ','.join([f'${i+1}' for i in range(len(columns))])
            updates = ','.join([f"{col}=EXCLUDED.{col}" for col in columns if col != 'id'])
            await conn.execute(
                f"""
                INSERT INTO {table_name} ({','.join(columns)}) VALUES ({values})
                ON CONFLICT (id) DO UPDATE SET {updates}
                """,
                *t
            )
        await conn.close()

    async def generateVectorTable(self, df: pd.DataFrame, table_name: str, create_query: str):
        conn = await self.connect_to_db()
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        await register_vector(conn)
        await conn.execute(create_query)
        for _, row in df.iterrows():
            # Upsert embedding
            await conn.execute(
                f"""
                INSERT INTO {table_name}_embeddings (id, content, embedding)
                VALUES ($1, $2, $3)
                ON CONFLICT (id, content) DO UPDATE SET embedding=EXCLUDED.embedding
                """,
                row["id"], row["content"], np.array(row["embedding"])
            )
        await conn.close()

    async def generateHNSWIndexing(self, table_name: str, m: int, operator: str, ef_construction: int, lists: int):
        conn = await self.connect_to_db()
        await register_vector(conn)
        try:
            await conn.execute(
                f"""CREATE INDEX IF NOT EXISTS {table_name}_embeddings_hnsw_idx
                    ON {table_name}_embeddings
                    USING hnsw(embedding {operator})
                    WITH (m = {m}, ef_construction = {ef_construction})
                """
            )
        except Exception as e:
            print(f"Warning: Could not create HNSW index: {e}")
        await conn.close()

    async def dropVectorTable(self, table_name: str):
        conn = await self.connect_to_db()
        await conn.execute(f"DROP TABLE IF EXISTS {table_name}_chat_history CASCADE")
        await conn.execute(f"DROP TABLE IF EXISTS {table_name}_embeddings CASCADE")
        await conn.execute(f"DROP TABLE IF EXISTS {table_name}_lsa_results CASCADE")
        await conn.execute(f"DROP TABLE IF EXISTS {table_name}_scoring CASCADE")
        await conn.execute(f"DROP TABLE IF EXISTS {table_name} CASCADE")
        await conn.close()

    async def clean_text(self, text: str) -> str:
        import re
        return re.sub(r"[^a-zA-Z0-9\s.,<>=]", "", text)
    
    async def create_lsa_results_table(self, table_name: str):
        """Create table to store LSA similarity results"""
        conn = await self.connect_to_db()
        await conn.execute(f"""
            CREATE TABLE IF NOT EXISTS {table_name}_lsa_results (
                id SERIAL PRIMARY KEY,
                innovation_id VARCHAR(1024) NOT NULL REFERENCES {table_name}(id),
                compared_innovation VARCHAR(1024),
                similarity_score FLOAT,
                compared_innovation_description TEXT,
                nama_inovator TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await conn.close()


    async def save_lsa_results(self, innovation_id: str, lsa_results: list, table_name: str = "innovations"):
        """Save LSA similarity results to database"""
        try:
            # Ensure LSA results table exists
            await self.create_lsa_results_table(table_name)
            
            conn = await self.connect_to_db()
            
            # Clear previous results for this innovation
            await conn.execute(
                f"DELETE FROM {table_name}_lsa_results WHERE innovation_id = $1",
                innovation_id
            )
            
            # Insert new results
            for result in lsa_results:
                await conn.execute(
                    f"""INSERT INTO {table_name}_lsa_results 
                        (innovation_id, compared_innovation, similarity_score, compared_innovation_description, nama_inovator)
                        VALUES ($1, $2, $3, $4, $5)""",
                    innovation_id,
                    result.get("nama_inovasi"),
                    result.get("similarity_score"),
                    result.get("compared_innovation_description"),
                    result.get("nama_inovator")
                )
            
            await conn.close()
            print(f"Saved {len(lsa_results)} LSA results for innovation {innovation_id}")
            
        except Exception as e:
            print(f"Failed to save LSA results: {e}")
    
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
        # df["id"] = [str(uuid.uuid4()) for _ in range(len(df))]

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
            CREATE TABLE IF NOT EXISTS {table_name} (
                id VARCHAR(1024) PRIMARY KEY,
                nama_inovasi TEXT,
                nama_inovator TEXT,
                bucket_name TEXT,
                link_document TEXT,
                latar_belakang TEXT,
                tujuan_inovasi TEXT,
                deskripsi_inovasi TEXT
            )
            """
        if not vector_query:
            vector_query = f"""
            CREATE TABLE IF NOT EXISTS {table_name}_embeddings (
                id VARCHAR(1024) NOT NULL REFERENCES {table_name}(id),
                content TEXT,
                embedding vector(768),
                PRIMARY KEY (id, content)
            )
            """

        # Create LSA results table, scoring table, and chat history table
        await self.create_lsa_results_table(table_name)
        await self.create_scoring_table(table_name)
        await self.create_chat_history_table(table_name)

        # *** IMPORTANT FIX: Drop pdf_path column before saving to database ***
        # pdf_path was only needed for processing, not for database storage
        df_for_db = df.drop(columns=['pdf_path'], errors='ignore')
        
        # Save main table and build vectors
        await self.generateSourceTable(df_for_db, table_name, create_query)
        
        vertex_embeddings = VertexAIEmbeddings(
            model_name="textembedding-gecko@003",
            location=self.vertex_location,
            max_output_tokens=768,
            credentials=self.credentials,
            project=self.vertex_project
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

    async def create_scoring_table(self, table_name: str):
        """Create table to store scoring results"""
        conn = await self.connect_to_db()
        await conn.execute(f"""
            CREATE TABLE IF NOT EXISTS {table_name}_scoring (
                id SERIAL PRIMARY KEY,
                innovation_id VARCHAR(1024) NOT NULL REFERENCES {table_name}(id),
                substansi_orisinalitas INTEGER,
                substansi_urgensi INTEGER,
                substansi_kedalaman INTEGER,
                analisis_dampak INTEGER,
                analisis_kelayakan INTEGER,
                analisis_data INTEGER,
                sistematika_struktur INTEGER,
                sistematika_bahasa INTEGER,
                sistematika_referensi INTEGER,
                total_score INTEGER,
                scoring_raw_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(innovation_id)
            )
        """)
        await conn.close()

    async def save_scoring_results(self, innovation_id: str, scoring_data: dict, table_name: str = "innovations"):
        """Save scoring results to database"""
        try:
            # Ensure scoring table exists
            await self.create_scoring_table(table_name)
            
            conn = await self.connect_to_db()
            
            # Prepare scoring values
            scoring_values = {
                'substansi_orisinalitas': scoring_data.get('substansi_orisinalitas'),
                'substansi_urgensi': scoring_data.get('substansi_urgensi'),
                'substansi_kedalaman': scoring_data.get('substansi_kedalaman'),
                'analisis_dampak': scoring_data.get('analisis_dampak'),
                'analisis_kelayakan': scoring_data.get('analisis_kelayakan'),
                'analisis_data': scoring_data.get('analisis_data'),
                'sistematika_struktur': scoring_data.get('sistematika_struktur'),
                'sistematika_bahasa': scoring_data.get('sistematika_bahasa'),
                'sistematika_referensi': scoring_data.get('sistematika_referensi'),
                'total_score': scoring_data.get('total'),
                'scoring_raw_data': json.dumps(scoring_data)
            }
            
            # Upsert scoring data
            await conn.execute(f"""
                INSERT INTO {table_name}_scoring 
                (innovation_id, substansi_orisinalitas, substansi_urgensi, substansi_kedalaman,
                 analisis_dampak, analisis_kelayakan, analisis_data, sistematika_struktur,
                 sistematika_bahasa, sistematika_referensi, total_score, scoring_raw_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (innovation_id) DO UPDATE SET
                    substansi_orisinalitas = EXCLUDED.substansi_orisinalitas,
                    substansi_urgensi = EXCLUDED.substansi_urgensi,
                    substansi_kedalaman = EXCLUDED.substansi_kedalaman,
                    analisis_dampak = EXCLUDED.analisis_dampak,
                    analisis_kelayakan = EXCLUDED.analisis_kelayakan,
                    analisis_data = EXCLUDED.analisis_data,
                    sistematika_struktur = EXCLUDED.sistematika_struktur,
                    sistematika_bahasa = EXCLUDED.sistematika_bahasa,
                    sistematika_referensi = EXCLUDED.sistematika_referensi,
                    total_score = EXCLUDED.total_score,
                    scoring_raw_data = EXCLUDED.scoring_raw_data,
                    created_at = CURRENT_TIMESTAMP
            """, innovation_id, *scoring_values.values())
            
            await conn.close()
            print(f"Saved scoring results for innovation {innovation_id}")
            
        except Exception as e:
            print(f"Failed to save scoring results: {e}")

    async def create_chat_history_table(self, table_name: str):
        """Create table to store chat history"""
        conn = await self.connect_to_db()
        await conn.execute(f"""
            CREATE TABLE IF NOT EXISTS {table_name}_chat_history (
                id SERIAL PRIMARY KEY,
                chat_id VARCHAR(1024) UNIQUE NOT NULL,
                innovation_id VARCHAR(1024) NOT NULL REFERENCES {table_name}(id),
                user_name VARCHAR(255),
                user_question TEXT NOT NULL,
                ai_response TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create index for faster queries
        await conn.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_{table_name}_chat_innovation_id 
            ON {table_name}_chat_history(innovation_id)
        """)
        
        await conn.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_{table_name}_chat_user_name 
            ON {table_name}_chat_history(user_name)
        """)
        
        await conn.close()

    async def save_chat_history(
        self, 
        chat_id: str, 
        innovation_id: str, 
        user_question: str, 
        ai_response: str,
        user_name: str,
        table_name: str = "innovations"
    ):
        """Save chat conversation to database"""
        try:
            # Ensure chat history table exists
            await self.create_chat_history_table(table_name)
            
            conn = await self.connect_to_db()
            
            await conn.execute(f"""
                INSERT INTO {table_name}_chat_history 
                (chat_id, innovation_id, user_name, user_question, ai_response)
                VALUES ($1, $2, $3, $4, $5)
            """, chat_id, innovation_id, user_name, user_question, ai_response)
            
            await conn.close()
            print(f"Saved chat history for innovation {innovation_id}")
            
        except Exception as e:
            print(f"Failed to save chat history: {e}")

    async def get_chat_history(
        self, 
        innovation_id: str, 
        limit: int = 50, 
        table_name: str = "innovations"
    ):
        """Get chat history for specific innovation"""
        try:
            conn = await self.connect_to_db()
            
            results = await conn.fetch(f"""
                SELECT chat_id, user_question, ai_response, created_at, user_name
                FROM {table_name}_chat_history 
                WHERE innovation_id = $1 
                ORDER BY created_at DESC 
                LIMIT $2
            """, innovation_id, limit)
            
            await conn.close()
            
            return [
                {
                    "chat_id": r["chat_id"],
                    "question": r["user_question"],
                    "answer": r["ai_response"],
                    "timestamp": r["created_at"].isoformat() if r["created_at"] else None,
                    "user_name": r["user_name"]
                } for r in results
            ]
            
        except Exception as e:
            print(f"Failed to get chat history: {e}")
            return []

    async def get_user_chat_summary(self, user_name: str, table_name: str = "innovations"):
        """Get summary of all chats for a specific user"""
        try:
            conn = await self.connect_to_db()
            
            results = await conn.fetch(f"""
                SELECT 
                    ch.innovation_id,
                    i.nama_inovasi,
                    COUNT(ch.id) as total_messages,
                    MAX(ch.created_at) as last_chat,
                    MIN(ch.created_at) as first_chat
                FROM {table_name}_chat_history ch
                JOIN {table_name} i ON ch.innovation_id = i.id
                WHERE ch.user_name = $1
                GROUP BY ch.innovation_id, i.nama_inovasi
                ORDER BY last_chat DESC
            """, user_name)
            
            await conn.close()
            
            return [
                {
                    "innovation_id": r["innovation_id"],
                    "innovation_name": r["nama_inovasi"],
                    "total_messages": r["total_messages"],
                    "last_chat": r["last_chat"].isoformat() if r["last_chat"] else None,
                    "first_chat": r["first_chat"].isoformat() if r["first_chat"] else None
                } for r in results
            ]
            
        except Exception as e:
            print(f"Failed to get user chat summary: {e}")
            return []

    async def search_chat_history(
        self, 
        search_query: str, 
        user_name: str = None, 
        innovation_id: str = None,
        table_name: str = "innovations"
    ):
        """Search through chat history"""
        try:
            conn = await self.connect_to_db()
            
            base_query = f"""
                SELECT 
                    ch.chat_id,
                    ch.innovation_id,
                    i.nama_inovasi,
                    ch.user_question,
                    ch.ai_response,
                    ch.created_at,
                    ch.user_name
                FROM {table_name}_chat_history ch
                JOIN {table_name} i ON ch.innovation_id = i.id
                WHERE (ch.user_question ILIKE $1 OR ch.ai_response ILIKE $1)
            """
            
            params = [f"%{search_query}%"]
            param_count = 1
            
            if user_name:
                param_count += 1
                base_query += f" AND ch.user_name = ${param_count}"
                params.append(user_name)
            
            if innovation_id:
                param_count += 1
                base_query += f" AND ch.innovation_id = ${param_count}"
                params.append(innovation_id)
            
            base_query += " ORDER BY ch.created_at DESC LIMIT 100"
            
            results = await conn.fetch(base_query, *params)
            await conn.close()
            
            return [
                {
                    "chat_id": r["chat_id"],
                    "innovation_id": r["innovation_id"],
                    "innovation_name": r["nama_inovasi"],
                    "question": r["user_question"],
                    "answer": r["ai_response"],
                    "timestamp": r["created_at"].isoformat() if r["created_at"] else None,
                    "user_name": r["user_name"]
                } for r in results
            ]
            
        except Exception as e:
            print(f"Failed to search chat history: {e}")
            return []
        
    async def get_lsa_results(self, innovation_id: str, table_name: str = "innovations"):
        """Get LSA similarity results for an innovation"""
        try:
            conn = await self.connect_to_db()
            rows = await conn.fetch(
                f"""SELECT 
                        compared_innovation,
                        similarity_score,
                        compared_innovation_description,
                        nama_inovator,
                        created_at
                    FROM {table_name}_lsa_results
                    WHERE innovation_id = $1
                    ORDER BY similarity_score DESC""",
                innovation_id
            )
            await conn.close()

            return [
                {
                    "compared_innovation_id": r["compared_innovation"],
                    "similarity_score": r["similarity_score"],
                    "compared_innovation_description": r["compared_innovation_description"],
                    "nama_inovator": r["nama_inovator"],
                    "created_at": r["created_at"].isoformat() if r["created_at"] else None
                }
                for r in rows
            ]
        except Exception as e:
            print(f"Failed to fetch LSA results: {e}")
            return []



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
            max_output_tokens=768,
            credentials=self.credentials,
            project=self.vertex_project
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
                t.nama_inovasi,
                t.nama_inovator,
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
                "nama_inovasi": r["nama_inovasi"],
                "nama_inovator": r["nama_inovator"],
                "latar_belakang": r["latar_belakang"],
                "tujuan_inovasi": r["tujuan_inovasi"],
                "deskripsi_inovasi": r["deskripsi_inovasi"],
                "link_document": r["link_document"],
                "similarity": r["similarity"]
            } for r in results
        ]
    
    async def get_innovation_ids_by_inovator(self, inovator_name: str, table_name: str = "innovations"):
        """Get innovation IDs for a specific inovator (case insensitive with space handling)"""
        try:
            # Clean the inovator name (replace spaces with underscores and lowercase)
            cleaned_inovator = inovator_name.lower().replace(" ", "_")
            
            conn = await self.connect_to_db()
            results = await conn.fetch(
                f"SELECT id FROM {table_name} WHERE nama_inovator LIKE $1",
                f"%{cleaned_inovator}%"
            )
            await conn.close()
            
            return [r["id"] for r in results]
            
        except Exception as e:
            print(f"Failed to get innovation IDs: {e}")
            return []