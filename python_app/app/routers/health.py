from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health():
    return {
        "ok": True,
        "service": settings.app_name,
        "stack": "python + sqlserver",
        "environment": settings.environment,
        "sqlserver_edition": settings.sqlserver_edition,
    }


@router.get("/db")
def database_health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"ok": True, "database": "sqlserver"}
