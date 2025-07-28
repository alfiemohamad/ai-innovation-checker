# main.py
import uuid
import json
import re
from pathlib import Path
import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from starlette.responses import JSONResponse
from module.vector import PostgreDB
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pd.set_option('display.max_columns', None)

app = FastAPI()
db = PostgreDB()

# Ensure the upload directory exists
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

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

@app.post("/innovations/")
async def upload_innovation(
    judul_inovasi: str = Form(...),
    file: UploadFile = File(...),
    table_name: str = Form("innovations")
):
    """
    Endpoint to upload an innovation PDF and its title.
    - Saves the uploaded PDF to disk
    - Extracts key sections using GeminiPDFExtractor
    - Stores metadata in Postgres and MinIO
    - Indexes embeddings for similarity search
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
    df = pd.DataFrame([{
        "pdf_path": str(local_path),  # This will be used for processing only
        "nama_inovasi": judul_inovasi.lower().replace(" ", "_"),
        "latar_belakang": extracted.get("latar_belakang", "TIDAK DITEMUKAN"),
        "tujuan_inovasi": extracted.get("tujuan_inovasi", "TIDAK DITEMUKAN"),
        "deskripsi_inovasi": extracted.get("deskripsi_inovasi", "TIDAK DITEMUKAN"),
    }])
    
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

    return JSONResponse({
        "status": status, 
        "table": table_name,
        "extracted_sections": {
            sec: "✓" if extracted.get(sec) and extracted[sec] != "TIDAK DITEMUKAN" else "✗"
            for sec in sections
        }
    })