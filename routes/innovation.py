from fastapi import APIRouter, Form, File, UploadFile, Header, HTTPException
from starlette.responses import JSONResponse
from pathlib import Path
from module.utils import save_uploaded_file, delete_file_from_uploads, build_inovasi_dataframe
from module.vector import PostgreDB
import pandas as pd

router = APIRouter()
db = PostgreDB()
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/innovations/")
async def upload_innovation(
    judul_inovasi: str = Form(...),
    file: UploadFile = File(...),
    table_name: str = Form("innovations"),
    x_inovator: str = Header(..., alias="X-Inovator")
):
    try:
        filename = file.filename.replace(" ", "_")
        file_bytes = await file.read()
        local_path = save_uploaded_file(UPLOAD_DIR, file_bytes, filename)
        extracted = {"latar_belakang": "TIDAK DITEMUKAN", "tujuan_inovasi": "TIDAK DITEMUKAN", "deskripsi_inovasi": "TIDAK DITEMUKAN"}
        df = build_inovasi_dataframe(local_path, judul_inovasi, x_inovator, extracted)
        innovation_id = df["id"].iloc[0]
        return {"status": "success", "innovation_id": innovation_id, "file_path": str(local_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload innovation: {e}")

@router.delete("/uploads/{filename}")
async def delete_uploaded_pdf(filename: str):
    success = delete_file_from_uploads(UPLOAD_DIR, filename)
    if success:
        return {"status": "success", "message": f"File '{filename}' deleted."}
    else:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found.")
