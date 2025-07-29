# main.py
import uuid
import json
import re
from pathlib import Path
import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Header, Request
from starlette.responses import JSONResponse
from module.vector import PostgreDB
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware

# Load env variables
load_dotenv()

# Komponen penilaian dari env
INOVASI_SCORING = {
    "substansi_orisinalitas": int(os.getenv("SCORING_SUBSTANSI_ORISINALITAS", 15)),
    "substansi_urgensi": int(os.getenv("SCORING_SUBSTANSI_URGENSI", 10)),
    "substansi_kedalaman": int(os.getenv("SCORING_SUBSTANSI_KEDALAMAN", 15)),
    "analisis_dampak": int(os.getenv("SCORING_ANALISIS_DAMPAK", 15)),
    "analisis_kelayakan": int(os.getenv("SCORING_ANALISIS_KELAYAKAN", 10)),
    "analisis_data": int(os.getenv("SCORING_ANALISIS_DATA", 10)),
    "sistematika_struktur": int(os.getenv("SCORING_SISTEMATIKA_STRUKTUR", 10)),
    "sistematika_bahasa": int(os.getenv("SCORING_SISTEMATIKA_BAHASA", 10)),
    "sistematika_referensi": int(os.getenv("SCORING_SISTEMATIKA_REFERENSI", 5)),
}

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pd.set_option('display.max_columns', None)

app = FastAPI()
db = PostgreDB()

# Ensure the upload directory exists
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ganti dengan ["http://localhost:5173"] jika ingin lebih aman
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logging.info(f"Incoming request: {request.method} {request.url.path}")
    response = await call_next(request)
    if response.status_code == 405:
        logging.warning(f"405 Method Not Allowed: {request.method} {request.url.path}")
    return response

def parse_extraction_result(extracted_data, sections):
    """
    Parse the extraction result, handling cases where JSON parsing failed
    but raw_response contains valid JSON data.
    """
    result = {}
    
    # If sections are already properly extracted, return them
    if all(sec in extracted_data and extracted_data[sec] != "TIDAK DITEMUKAN" for sec in sections):
        return {sec: extracted_data[sec] for sec in sections}
    
    # Try to parse from raw_response if available
    raw_response = extracted_data.get('raw_response', '')
    if raw_response:
        # Extract JSON from markdown code block
        json_match = re.search(r'```json\s*\n(.*?)\n```', raw_response, re.DOTALL)
        if json_match:
            try:
                json_data = json.loads(json_match.group(1))
                for sec in sections:
                    result[sec] = json_data.get(sec, "TIDAK DITEMUKAN")
                logger.info("Successfully parsed JSON from markdown code block")
                return result
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse JSON from markdown: {e}")
        
        # Try to find raw JSON
        json_start = raw_response.find('{')
        json_end = raw_response.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            try:
                json_str = raw_response[json_start:json_end]
                json_data = json.loads(json_str)
                for sec in sections:
                    result[sec] = json_data.get(sec, "TIDAK DITEMUKAN")
                logger.info("Successfully parsed JSON from raw text")
                return result
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse raw JSON: {e}")
    
    # Fallback to original data or "TIDAK DITEMUKAN"
    for sec in sections:
        result[sec] = extracted_data.get(sec, "TIDAK DITEMUKAN")
    
    return result

def lsa_similarity(query_text, documents):
    # Jika tidak ada dokumen pembanding, kembalikan array kosong
    if not documents:
        return np.array([])
    # Gabungkan query dan dokumen pembanding ke dalam satu list
    all_texts = [query_text] + documents
    # Ubah teks menjadi matriks TF-IDF
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    # Jika fitur terlalu sedikit, kembalikan matriks identitas
    if tfidf_matrix.shape[1] < 2:
        return np.eye(len(all_texts))
    # Tentukan jumlah topik untuk LSA (maksimal 10 atau jumlah dokumen)
    n_topics = min(10, len(all_texts))
    # Reduksi dimensi dengan LSA (TruncatedSVD)
    lsa = TruncatedSVD(n_components=n_topics)
    lsa_matrix = lsa.fit_transform(tfidf_matrix)
    # Hitung cosine similarity antar dokumen
    return cosine_similarity(lsa_matrix, lsa_matrix)

def generate_inovasi_id(judul_inovasi: str, nama_inovator: str) -> str:
    """Generate unique id for inovasi based on judul and inovator."""
    return f"{judul_inovasi.lower().replace(' ', '_')}_{nama_inovator.lower().replace(' ', '_')}"

def build_inovasi_dataframe(local_path, judul_inovasi, x_inovator, extracted):
    """Build DataFrame for inovasi upload."""
    return pd.DataFrame([{
        "pdf_path": str(local_path),
        "nama_inovasi": judul_inovasi.lower().replace(" ", "_"),
        "nama_inovator": x_inovator.lower().replace(" ", "_"),
        "id": generate_inovasi_id(judul_inovasi, x_inovator),
        "latar_belakang": extracted.get("latar_belakang", "TIDAK DITEMUKAN"),
        "tujuan_inovasi": extracted.get("tujuan_inovasi", "TIDAK DITEMUKAN"),
        "deskripsi_inovasi": extracted.get("deskripsi_inovasi", "TIDAK DITEMUKAN"),
    }])

def generate_ai_summary(extracted_sections, judul_inovasi):
    """Generate AI summary from extracted sections"""
    try:
        # Create a comprehensive summary prompt
        latar_belakang = extracted_sections.get('latar_belakang', 'Tidak tersedia')
        tujuan_inovasi = extracted_sections.get('tujuan_inovasi', 'Tidak tersedia')
        deskripsi_inovasi = extracted_sections.get('deskripsi_inovasi', 'Tidak tersedia')
        
        summary_prompt = f"""
        Berdasarkan informasi dari dokumen inovasi "{judul_inovasi}", buatlah ringkasan komprehensif dan informatif.

        **Data Inovasi:**
        - Judul: {judul_inovasi}
        - Latar Belakang: {latar_belakang[:500]}...
        - Tujuan: {tujuan_inovasi[:300]}...
        - Deskripsi: {deskripsi_inovasi[:400]}...

        **Instruksi Ringkasan:**
        Buatlah ringkasan dalam format JSON dengan struktur berikut:
        {{
            "ringkasan_singkat": "Ringkasan 2-3 kalimat tentang inti inovasi",
            "masalah_yang_diatasi": "Masalah utama yang ingin diselesaikan",
            "solusi_yang_ditawarkan": "Pendekatan atau solusi yang diusulkan",
            "potensi_manfaat": "Manfaat dan dampak yang diharapkan",
            "keunikan_inovasi": "Aspek yang membedakan dari solusi lain"
        }}

        Pastikan ringkasan objektif, informatif, dan mudah dipahami.
        """
        
        # Use a simple text prompt instead of PDF for summary generation
        summary_result = db.extractor.model.generate_content([summary_prompt])
        
        if summary_result and summary_result.text:
            try:
                # Try to parse as JSON
                json_match = re.search(r'\{.*\}', summary_result.text, re.DOTALL)
                if json_match:
                    summary_json = json.loads(json_match.group())
                    return summary_json
                else:
                    return {"ringkasan_umum": summary_result.text.strip()}
            except:
                return {"ringkasan_umum": summary_result.text.strip()}
        else:
            return {"error": "Ringkasan tidak dapat dibuat"}
            
    except Exception as e:
        logger.error(f"Failed to generate AI summary: {e}")
        return {"error": f"Gagal membuat ringkasan: {str(e)}"}

@app.post("/innovations/")
async def upload_innovation(
    judul_inovasi: str = Form(...),
    file: UploadFile = File(...),
    table_name: str = Form("innovations"),
    x_inovator: str = Header(..., alias="X-Inovator")
):
    """
    Endpoint untuk upload PDF inovasi dan judulnya.
    User login inovator diambil dari header X-Inovator.
    Alur:
    1. Simpan file PDF ke disk lokal.
    2. Ekstrak section penting dari PDF (latar belakang, tujuan inovasi, deskripsi inovasi).
    3. Buat DataFrame dari hasil ekstraksi.
    4. Simpan data ke database dan upload file ke MinIO, serta generate vector embeddings.
    5. Generate ringkasan AI dari dokumen.
    6. Return ringkasan dan status code.
    """
    # 1. Save the uploaded PDF
    ext = Path(file.filename).suffix
    tmp_name = f"{uuid.uuid4()}{ext}"
    local_path = UPLOAD_DIR / tmp_name
    try:
        contents = await file.read()
        local_path.write_bytes(contents)
        logger.info(f"File saved successfully: {local_path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file '{file.filename}': {e}")

    # 2. Extract sections via GeminiPDFExtractor
    sections = ["latar_belakang", "tujuan_inovasi", "deskripsi_inovasi"]
    try:
        extracted_raw = db.extractor.extract_multiple_sections(str(local_path), sections)
        logger.info(f"Raw extraction result: {extracted_raw}")
        
        # Parse the extraction result properly
        extracted = parse_extraction_result(extracted_raw, sections)
        logger.info(f"Parsed sections: {extracted}")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction error for file '{local_path}': {e}")

    # 3. Build a pandas DataFrame in the expected shape
    df = build_inovasi_dataframe(local_path, judul_inovasi, x_inovator, extracted)
    
    logger.info(f"DataFrame created with extracted data:")
    for col in ["latar_belakang", "tujuan_inovasi", "deskripsi_inovasi"]:
        logger.info(f"  {col}: {df[col].iloc[0][:100]}...")
    
    logger.info(f"PDF will be uploaded to MinIO and local file will be deleted after processing")

    # 4. Invoke build_table to persist and index
    try:
        status = await db.build_table(df, table_name)
        logger.info(f'Build table status: {status}')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"build_table failed for '{table_name}': {e}")

    # 5. Generate AI summary
    try:
        ai_summary = generate_ai_summary(extracted, judul_inovasi)
    except Exception as e:
        logger.error(f"Failed to generate AI summary: {e}")
        ai_summary = "Ringkasan tidak dapat dibuat"

    return JSONResponse({
        "status": "success", 
        "code": 200,
        "table": table_name,
        "extracted_sections": {
            sec: "✓" if extracted.get(sec) and extracted[sec] != "TIDAK DITEMUKAN" else "✗"
            for sec in sections
        },
        "ai_summary": ai_summary,
        "innovation_id": df['id'].iloc[0]
    })

@app.post("/get_score")
async def get_score(
    id: str = Form(...),
    table_name: str = Form("innovations"),
    x_inovator: str = Header(..., alias="X-Inovator")
):
    """
    Endpoint untuk menilai inovasi berdasarkan komponen penilaian dari env.
    File diambil dari MinIO, tidak upload ulang.
    Juga melakukan LSA similarity check dan menyimpan hasil ke database.
    """
    # Get innovation data from database
    try:
        conn = await db.connect_to_db()
        row = await conn.fetchrow(
            f"""SELECT link_document, nama_inovasi, nama_inovator, 
                      latar_belakang, tujuan_inovasi, deskripsi_inovasi 
               FROM {table_name} WHERE id = $1""", 
            id
        )
        if not row or not row["link_document"]:
            await conn.close()
            raise HTTPException(status_code=404, detail="Innovation not found or link_document missing")
        
        innovation_data = dict(row)
        await conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get innovation data: {e}")

    # Parse object name from link_document
    try:
        from urllib.parse import urlparse
        parsed = urlparse(innovation_data["link_document"])
        object_path = parsed.path.lstrip("/")
        parts = object_path.split("/", 1)
        if len(parts) != 2:
            raise Exception("Invalid link_document format")
        bucket_name, object_name = parts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse object name: {e}")

    # Download file from MinIO
    local_path = UPLOAD_DIR / f"{id}.pdf"
    try:
        db.minio_client.fget_object(bucket_name, object_name, str(local_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download file from MinIO: {e}")

    # Get scoring using multimodal_model
    try:
        prompt = db.extractor.build_scoring_prompt()
        result = db.extractor.extract_with_custom_prompt(str(local_path), prompt)
        if result:
            try:
                # Clean and parse JSON
                cleaned_result = result.replace("'", '"')
                score_json = json.loads(cleaned_result)
                
                # Save scoring results to database
                if isinstance(score_json, dict) and "error" not in score_json:
                    await db.save_scoring_results(id, score_json)
                    
            except Exception:
                # Try to extract JSON from text
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    try:
                        score_json = json.loads(json_match.group().replace("'", '"'))
                        # Save scoring results to database
                        if isinstance(score_json, dict) and "error" not in score_json:
                            await db.save_scoring_results(id, score_json)
                    except:
                        score_json = {"raw": result, "error": "Failed to parse scoring JSON"}
                else:
                    score_json = {"raw": result, "error": "No JSON found in response"}
        else:
            score_json = {"error": "No result from model"}
    except Exception as e:
        score_json = {"error": str(e)}

    # Perform LSA similarity check
    try:
        # Combine sections for query
        query_text = f"{innovation_data['latar_belakang']} {innovation_data['tujuan_inovasi']} {innovation_data['deskripsi_inovasi']}"
        
        # Vector search for similar documents (excluding current document)
        results = await db.similarity_search_plagiarisme(
            query_text, 0.7, 10, table_name
        )
        
        lsa_results = []
        if not isinstance(results, dict) or "message" not in results:
            # Filter out the current document
            filtered_results = [r for r in results if r.get('id') != id]
            
            # Prepare texts for LSA
            doc_texts = [
                f"{r['latar_belakang']} {r['tujuan_inovasi']} {r['deskripsi_inovasi']}"
                for r in filtered_results
            ]
            
            if doc_texts:
                lsa_sim_matrix = lsa_similarity(query_text, doc_texts)
                for i, r in enumerate(filtered_results):
                    lsa_score = float(lsa_sim_matrix[0, i+1]) if lsa_sim_matrix.shape[0] > 1 else 0.0
                    lsa_results.append({
                        "similarity_score": round(lsa_score, 4),
                        "link_document": r["link_document"],
                        "nama_inovator": r.get("nama_inovator", "Unknown"),
                        "compared_innovation_id": r.get("id", "Unknown")
                    })
        
        # Save LSA results to database
        await db.save_lsa_results(id, lsa_results)
        
    except Exception as e:
        logger.error(f"LSA similarity check failed: {e}")
        lsa_results = []

    # Clean up downloaded file
    try:
        os.remove(local_path)
    except Exception:
        pass

    # Prepare response with component scores and total
    response_data = {
        "innovation_id": id,
        "nama_inovasi": innovation_data["nama_inovasi"],
        "nama_inovator": innovation_data["nama_inovator"],
        "link_document": innovation_data["link_document"],
        "component_scores": {},
        "total_score": 0,
        "plagiarism_check": lsa_results
    }

    # Extract component scores if available
    if isinstance(score_json, dict) and "error" not in score_json:
        for component in INOVASI_SCORING.keys():
            if component in score_json:
                response_data["component_scores"][component] = score_json[component]
        
        response_data["total_score"] = score_json.get("total", 0)
    else:
        response_data["scoring_error"] = score_json

    return JSONResponse(response_data)

@app.get("/innovations/{innovation_id}/lsa_results")
async def get_innovation_lsa_results(
    innovation_id: str,
    table_name: str = "innovations"
):
    """
    Endpoint untuk mendapatkan hasil LSA similarity yang sudah tersimpan untuk suatu inovasi
    """
    try:
        lsa_results = await db.get_lsa_results(innovation_id, table_name)
        
        if not lsa_results:
            return JSONResponse({
                "message": "No LSA results found for this innovation",
                "innovation_id": innovation_id,
                "results": []
            })
        
        return JSONResponse({
            "innovation_id": innovation_id,
            "total_similar_documents": len(lsa_results),
            "lsa_results": lsa_results
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get LSA results: {e}")

@app.get("/innovations/{innovation_id}/summary")
async def get_innovation_summary(
    innovation_id: str,
    table_name: str = "innovations"
):
    """
    Endpoint untuk mendapatkan ringkasan inovasi berdasarkan data yang tersimpan
    """
    try:
        # Get innovation data from database
        conn = await db.connect_to_db()
        row = await conn.fetchrow(
            f"""SELECT nama_inovasi, nama_inovator, latar_belakang, 
                      tujuan_inovasi, deskripsi_inovasi, link_document
               FROM {table_name} WHERE id = $1""", 
            innovation_id
        )
        await conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Innovation not found")
        
        innovation_data = dict(row)
        
        # Generate fresh summary
        extracted = {
            'latar_belakang': innovation_data['latar_belakang'],
            'tujuan_inovasi': innovation_data['tujuan_inovasi'],
            'deskripsi_inovasi': innovation_data['deskripsi_inovasi']
        }
        
        ai_summary = generate_ai_summary(extracted, innovation_data['nama_inovasi'])
        
        return JSONResponse({
            "innovation_id": innovation_id,
            "nama_inovasi": innovation_data['nama_inovasi'],
            "nama_inovator": innovation_data['nama_inovator'],
            "link_document": innovation_data['link_document'],
            "ai_summary": ai_summary
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {e}")

@app.post("/innovations/{innovation_id}/chat")
async def chat_about_innovation(
    innovation_id: str,
    question: str = Form(...),
    table_name: str = Form("innovations"),
    x_inovator: str = Header(..., alias="X-Inovator")
):
    """
    Endpoint untuk tanya jawab terkait data inovasi yang sudah disubmit.
    Menyimpan riwayat percakapan dan memberikan jawaban berdasarkan dokumen PDF.
    """
    try:
        # Validate innovation exists and get data
        conn = await db.connect_to_db()
        row = await conn.fetchrow(
            f"""SELECT nama_inovasi, nama_inovator, latar_belakang, 
                      tujuan_inovasi, deskripsi_inovasi, link_document, bucket_name
               FROM {table_name} WHERE id = $1""", 
            innovation_id
        )
        
        if not row:
            await conn.close()
            raise HTTPException(status_code=404, detail="Innovation not found")
        
        innovation_data = dict(row)
        
        # Check if user has access to this innovation (optional security check)
        if innovation_data['nama_inovator'] != x_inovator.lower().replace(" ", "_"):
            await conn.close()
            raise HTTPException(status_code=403, detail="Access denied to this innovation")
        
        await conn.close()
        
        # Get the PDF from MinIO for context
        try:
            from urllib.parse import urlparse
            parsed = urlparse(innovation_data["link_document"])
            object_path = parsed.path.lstrip("/")
            parts = object_path.split("/", 1)
            if len(parts) != 2:
                raise Exception("Invalid link_document format")
            bucket_name, object_name = parts
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse document link: {e}")

        # Download PDF temporarily for AI processing
        local_path = UPLOAD_DIR / f"chat_{innovation_id}_{uuid.uuid4().hex[:8]}.pdf"
        try:
            db.minio_client.fget_object(bucket_name, object_name, str(local_path))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to download PDF: {e}")

        # Prepare context-aware prompt
        context_prompt = f"""
        Anda adalah asisten AI yang membantu menjawab pertanyaan tentang dokumen inovasi.
        
        **Informasi Inovasi:**
        - Nama Inovasi: {innovation_data['nama_inovasi']}
        - Nama Inovator: {innovation_data['nama_inovator']}
        
        **Data Ekstrak Sebelumnya:**
        - Latar Belakang: {innovation_data['latar_belakang'][:300]}...
        - Tujuan: {innovation_data['tujuan_inovasi'][:200]}...
        - Deskripsi: {innovation_data['deskripsi_inovasi'][:300]}...
        
        **Pertanyaan User:** {question}
        
        **Instruksi:**
        1. Jawab pertanyaan berdasarkan dokumen PDF yang tersedia
        2. Gunakan informasi dari dokumen sebagai referensi utama
        3. Jika informasi tidak tersedia di dokumen, jelaskan dengan jelas
        4. Berikan jawaban yang informatif dan akurat
        5. Gunakan bahasa Indonesia yang baik dan benar
        
        Jawab pertanyaan dengan format yang jelas dan terstruktur.
        """

        # Get AI response using the PDF
        try:
            ai_response = db.extractor.extract_with_custom_prompt(str(local_path), context_prompt)
            if not ai_response:
                ai_response = "Maaf, saya tidak dapat memproses pertanyaan Anda saat ini."
        except Exception as e:
            logger.error(f"Failed to get AI response: {e}")
            ai_response = "Terjadi kesalahan saat memproses pertanyaan Anda."

        # Save chat history to database
        chat_id = str(uuid.uuid4())
        await db.save_chat_history(
            chat_id=chat_id,
            innovation_id=innovation_id,
            user_question=question,
            ai_response=ai_response,
            user_name=x_inovator
        )

        # Clean up temporary file
        try:
            os.remove(local_path)
        except Exception:
            pass

        return JSONResponse({
            "chat_id": chat_id,
            "innovation_id": innovation_id,
            "question": question,
            "answer": ai_response,
            "timestamp": pd.Timestamp.now().isoformat(),
            "innovation_name": innovation_data['nama_inovasi']
        })

    except HTTPException:
        raise
    except Exception as e:
        # Clean up temporary file in case of error
        try:
            if 'local_path' in locals():
                os.remove(local_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {e}")

@app.get("/innovations/{innovation_id}/chat_history")
async def get_chat_history(
    innovation_id: str,
    limit: int = 50,
    table_name: str = "innovations",
    x_inovator: str = Header(..., alias="X-Inovator")
):
    """
    Endpoint untuk mendapatkan riwayat percakapan untuk suatu inovasi.
    """
    try:
        # Verify innovation exists and user has access
        conn = await db.connect_to_db()
        row = await conn.fetchrow(
            f"SELECT nama_inovator FROM {table_name} WHERE id = $1", 
            innovation_id
        )
        
        if not row:
            await conn.close()
            raise HTTPException(status_code=404, detail="Innovation not found")
        
        # Check access
        if row['nama_inovator'] != x_inovator.lower().replace(" ", "_"):
            await conn.close()
            raise HTTPException(status_code=403, detail="Access denied to this innovation")
        
        await conn.close()

        # Get chat history
        chat_history = await db.get_chat_history(innovation_id, limit)
        
        return JSONResponse({
            "innovation_id": innovation_id,
            "total_conversations": len(chat_history),
            "chat_history": chat_history
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chat history: {e}")

@app.get("/users/{user_name}/chat_summary")
async def get_user_chat_summary(
    user_name: str,
    table_name: str = "innovations",
    x_inovator: str = Header(..., alias="X-Inovator")
):
    """
    Endpoint untuk mendapatkan ringkasan semua percakapan user.
    """
    try:
        # Verify user access
        if x_inovator.lower().replace(" ", "_") != user_name.lower().replace(" ", "_"):
            raise HTTPException(status_code=403, detail="Access denied")

        # Get user's chat summary
        chat_summary = await db.get_user_chat_summary(user_name)
        
        return JSONResponse({
            "user_name": user_name,
            "total_innovations_discussed": len(chat_summary),
            "chat_summary": chat_summary
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chat summary: {e}")

@app.post("/chat/search")
async def search_chat_history(
    search_query: str = Form(...),
    innovation_id: str = Form(None),
    table_name: str = Form("innovations"),
    x_inovator: str = Header(..., alias="X-Inovator")
):
    """
    Endpoint untuk mencari dalam riwayat percakapan berdasarkan kata kunci.
    """
    try:
        if not search_query.strip():
            raise HTTPException(status_code=400, detail="Search query cannot be empty")

        # Search chat history
        search_results = await db.search_chat_history(
            search_query=search_query,
            user_name=x_inovator,
            innovation_id=innovation_id,
            table_name=table_name
        )
        
        return JSONResponse({
            "search_query": search_query,
            "user_name": x_inovator,
            "innovation_id": innovation_id,
            "total_results": len(search_results),
            "results": search_results
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")

@app.delete("/innovations/{innovation_id}/chat_history")
async def delete_chat_history(
    innovation_id: str,
    table_name: str = "innovations",
    x_inovator: str = Header(..., alias="X-Inovator")
):
    """
    Endpoint untuk menghapus riwayat percakapan untuk suatu inovasi.
    """
    try:
        # Verify innovation exists and user has access
        conn = await db.connect_to_db()
        row = await conn.fetchrow(
            f"SELECT nama_inovator FROM {table_name} WHERE id = $1", 
            innovation_id
        )
        
        if not row:
            await conn.close()
            raise HTTPException(status_code=404, detail="Innovation not found")
        
        # Check access
        if row['nama_inovator'] != x_inovator.lower().replace(" ", "_"):
            await conn.close()
            raise HTTPException(status_code=403, detail="Access denied to this innovation")
        
        # Delete chat history
        result = await conn.execute(
            f"DELETE FROM {table_name}_chat_history WHERE innovation_id = $1", 
            innovation_id
        )
        
        await conn.close()
        
        # Extract number of deleted rows
        deleted_count = int(result.split()[-1]) if result and result.split()[-1].isdigit() else 0
        
        return JSONResponse({
            "message": "Chat history deleted successfully",
            "innovation_id": innovation_id,
            "deleted_conversations": deleted_count
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete chat history: {e}")

@app.get("/innovations/{innovation_id}/chat_analytics")
async def get_chat_analytics(
    innovation_id: str,
    table_name: str = "innovations",
    x_inovator: str = Header(..., alias="X-Inovator")
):
    """
    Endpoint untuk mendapatkan analitik percakapan untuk suatu inovasi.
    """
    try:
        # Verify access
        conn = await db.connect_to_db()
        row = await conn.fetchrow(
            f"SELECT nama_inovator, nama_inovasi FROM {table_name} WHERE id = $1", 
            innovation_id
        )
        
        if not row:
            await conn.close()
            raise HTTPException(status_code=404, detail="Innovation not found")
        
        if row['nama_inovator'] != x_inovator.lower().replace(" ", "_"):
            await conn.close()
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get chat analytics
        analytics = await conn.fetchrow(f"""
            SELECT 
                COUNT(*) as total_conversations,
                COUNT(DISTINCT DATE(created_at)) as active_days,
                AVG(LENGTH(user_question)) as avg_question_length,
                AVG(LENGTH(ai_response)) as avg_response_length,
                MIN(created_at) as first_conversation,
                MAX(created_at) as last_conversation
            FROM {table_name}_chat_history 
            WHERE innovation_id = $1
        """, innovation_id)
        
        # Get most common question patterns (simple word frequency)
        common_words = await conn.fetch(f"""
            SELECT word, COUNT(*) as frequency
            FROM (
                SELECT unnest(string_to_array(lower(user_question), ' ')) as word
                FROM {table_name}_chat_history 
                WHERE innovation_id = $1
            ) words
            WHERE LENGTH(word) > 3
              AND word NOT IN ('yang', 'adalah', 'untuk', 'dari', 'dengan', 'pada', 'dalam', 'atau', 'dan', 'ini', 'itu', 'akan', 'dapat', 'tidak', 'ada', 'juga', 'saya', 'anda', 'bagaimana', 'mengapa', 'apakah')
            GROUP BY word
            ORDER BY frequency DESC
            LIMIT 10
        """, innovation_id)
        
        await conn.close()
        
        return JSONResponse({
            "innovation_id": innovation_id,
            "innovation_name": row['nama_inovasi'],
            "analytics": {
                "total_conversations": analytics['total_conversations'] if analytics else 0,
                "active_days": analytics['active_days'] if analytics else 0,
                "avg_question_length": round(float(analytics['avg_question_length']) if analytics and analytics['avg_question_length'] else 0, 2),
                "avg_response_length": round(float(analytics['avg_response_length']) if analytics and analytics['avg_response_length'] else 0, 2),
                "first_conversation": analytics['first_conversation'].isoformat() if analytics and analytics['first_conversation'] else None,
                "last_conversation": analytics['last_conversation'].isoformat() if analytics and analytics['last_conversation'] else None
            },
            "common_question_words": [
                {"word": row['word'], "frequency": row['frequency']} 
                for row in common_words
            ]
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chat analytics: {e}")
    
@app.get("/innovations/by_inovator")
async def get_innovations_by_inovator(
    x_inovator: str = Header(..., alias="X-Inovator"),
    table_name: str = "innovations"
):
    """
    Endpoint untuk mendapatkan semua innovation ID berdasarkan nama inovator.
    Nama inovator diambil dari header X-Inovator.
    Handle spasi dalam nama dengan mengganti menjadi underscore.
    """
    try:
        # Get innovation IDs from database
        innovation_ids = await db.get_innovation_ids_by_inovator(x_inovator, table_name)
        
        return JSONResponse({
            "inovator_name": x_inovator,
            "processed_inovator_name": x_inovator.lower().replace(" ", "_"),
            "total_innovations": len(innovation_ids),
            "innovation_ids": innovation_ids
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get innovations: {e}")