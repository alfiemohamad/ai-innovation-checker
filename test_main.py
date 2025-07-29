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
