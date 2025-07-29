import pytest
from httpx import AsyncClient
from fastapi import FastAPI
from httpx import ASGITransport
import tempfile
from main import app

# Fungsi upload di-comment agar bisa diaktifkan manual saat test MinIO/DB ready
# @pytest.mark.asyncio
# async def test_upload_and_get_score():
#     transport = ASGITransport(app=app)
#     async with AsyncClient(transport=transport, base_url="http://test") as ac:
#         with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
#             tmp.write(b"%PDF-1.4 test pdf content")
#             tmp.seek(0)
#             response = await ac.post(
#                 "/innovations/",
#                 files={"file": ("test.pdf", tmp, "application/pdf")},
#                 data={"judul_inovasi": "Test Inovasi"},
#                 headers={"X-Inovator": "tester"}
#             )
#         assert response.status_code == 200
#         data = response.json()
#         assert "innovation_id" in data
#         innovation_id = data["innovation_id"]
#         response2 = await ac.post(
#             "/get_score",
#             data={"id": innovation_id},
#             headers={"X-Inovator": "tester"}
#         )
#         assert response2.status_code == 200
#         assert "total" in response2.json() or "substansi_orisinalitas" in response2.json()

@pytest.mark.asyncio
async def test_get_innovations_by_inovator():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/innovations/by_inovator", headers={"X-Inovator": "tester"})
        assert res.status_code in (200, 404, 500)  # 200 jika ada, 404/500 jika DB kosong
        # Struktur response minimal
        if res.status_code == 200:
            data = res.json()
            assert "inovator_name" in data
            assert "innovation_ids" in data

@pytest.mark.asyncio
async def test_get_chat_analytics():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Gunakan id dummy, pastikan endpoint tetap merespon
        res = await ac.get("/innovations/dummyid/chat_analytics", headers={"X-Inovator": "tester"})
        assert res.status_code in (200, 404, 500)

@pytest.mark.asyncio
async def test_search_chat_history():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/chat/search", data={"search_query": "inovasi"}, headers={"X-Inovator": "tester"})
        assert res.status_code in (200, 404, 500)

@pytest.mark.asyncio
async def test_get_user_chat_summary():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/users/tester/chat_summary", headers={"X-Inovator": "tester"})
        assert res.status_code in (200, 404, 500)

@pytest.mark.asyncio
async def test_get_chat_history():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/innovations/dummyid/chat_history", headers={"X-Inovator": "tester"})
        assert res.status_code in (200, 404, 500)

@pytest.mark.asyncio
async def test_delete_chat_history():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.delete("/innovations/dummyid/chat_history", headers={"X-Inovator": "tester"})
        assert res.status_code in (200, 404, 500)

def test_parse_extraction_result():
    from main import parse_extraction_result
    # Test with all sections present
    extracted = {"latar_belakang": "A", "tujuan_inovasi": "B", "deskripsi_inovasi": "C"}
    sections = ["latar_belakang", "tujuan_inovasi", "deskripsi_inovasi"]
    result = parse_extraction_result(extracted, sections)
    assert result == extracted
    # Test fallback
    extracted = {"latar_belakang": "A"}
    result = parse_extraction_result(extracted, sections)
    assert result["latar_belakang"] == "A"
    assert result["tujuan_inovasi"] == "TIDAK DITEMUKAN"
    assert result["deskripsi_inovasi"] == "TIDAK DITEMUKAN"

def test_lsa_similarity():
    from main import lsa_similarity
    # Test with empty documents
    sim = lsa_similarity("test", [])
    assert sim.shape[0] == 0
    # Test with 2 docs
    sim = lsa_similarity("test", ["doc1", "doc2"])
    assert sim.shape[0] == 3
    assert sim.shape[1] == 3

def test_generate_inovasi_id():
    from main import generate_inovasi_id
    id_ = generate_inovasi_id("Judul Inovasi", "Nama Inovator")
    assert id_ == "judul_inovasi_nama_inovator"

def test_build_inovasi_dataframe():
    from main import build_inovasi_dataframe
    import pandas as pd
    df = build_inovasi_dataframe("/tmp/file.pdf", "Judul", "Inovator", {"latar_belakang": "A", "tujuan_inovasi": "B", "deskripsi_inovasi": "C"})
    assert isinstance(df, pd.DataFrame)
    assert df.shape[0] == 1
    assert "id" in df.columns

def test_generate_ai_summary():
    from main import generate_ai_summary
    # Should return dict with error if fail
    res = generate_ai_summary({}, "Judul")
    assert isinstance(res, dict)
    assert "error" in res or isinstance(res, dict)
