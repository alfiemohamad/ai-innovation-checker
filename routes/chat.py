from fastapi import APIRouter, Form, Header, HTTPException
from starlette.responses import JSONResponse
from module.vector import PostgreDB

router = APIRouter()
db = PostgreDB()

@router.get("/innovations/{innovation_id}/chat_history")
async def get_chat_history(
    innovation_id: str,
    limit: int = 50,
    table_name: str = "innovations",
    x_inovator: str = Header(..., alias="X-Inovator")
):
    try:
        conn = await db.connect_to_db()
        row = await conn.fetchrow(
            f"SELECT nama_inovator FROM {table_name} WHERE id = $1", 
            innovation_id
        )
        if not row:
            await conn.close()
            raise HTTPException(status_code=404, detail="Innovation not found")
        if row['nama_inovator'] != x_inovator.lower().replace(" ", "_"):
            await conn.close()
            raise HTTPException(status_code=403, detail="Access denied to this innovation")
        await conn.close()
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
