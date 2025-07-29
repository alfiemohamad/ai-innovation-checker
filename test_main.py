import pytest
from fastapi.testclient import TestClient
from main import app
import tempfile
from httpx import AsyncClient
from fastapi import FastAPI
from httpx import ASGITransport

@pytest.mark.asyncio
async def test_upload_and_get_score():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Simulasi upload PDF
        with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
            tmp.write(b"%PDF-1.4 test pdf content")
            tmp.seek(0)
            response = ac.post(
                "/innovations/",
                files={"file": ("test.pdf", tmp, "application/pdf")},
                data={"judul_inovasi": "Test Inovasi"},
                headers={"X-Inovator": "tester"}
            )
        assert response.status_code == 200
        data = response.json()
        assert "innovation_id" in data
        innovation_id = data["innovation_id"]

        # Get score
        response2 = ac.post(
            "/get_score",
            data={"id": innovation_id},
            headers={"X-Inovator": "tester"}
        )
        assert response2.status_code == 200
        assert "total" in response2.json() or "substansi_orisinalitas" in response2.json()

@pytest.mark.asyncio
async def test_summary_and_chat():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Dummy upload
        with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
            tmp.write(b"%PDF-1.4 test pdf content")
            tmp.seek(0)
            response = ac.post(
                "/innovations/",
                files={"file": ("test2.pdf", tmp, "application/pdf")},
                data={"judul_inovasi": "Test2"},
                headers={"X-Inovator": "tester2"}
            )
        assert response.status_code == 200
        innovation_id = response.json()["innovation_id"]

        # Summary
        res = ac.get(f"/innovations/{innovation_id}/summary", headers={"X-Inovator": "tester2"})
        assert res.status_code == 200
        assert "summary" in res.json() or res.json() != {}

        # Chat
        chat = ac.post(f"/innovations/{innovation_id}/chat", data={"question": "Apa itu inovasi?", "table_name": "innovations"}, headers={"X-Inovator": "tester2"})
        assert chat.status_code == 200
        assert "answer" in chat.json() or chat.json() != {}

# Tambahkan test lain untuk endpoint analytics, chat_history, dll agar coverage >90%
