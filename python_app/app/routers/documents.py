from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Document, User
from ..schemas import CreateDocumentRequest, DocumentResponse
from ..security import get_current_user, require_roles
from ..utils import new_id

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    docs = (
        db.query(Document)
        .filter(Document.society_id == current_user.society_id)
        .order_by(Document.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        DocumentResponse(
            id=d.id,
            title=d.title,
            category=d.category,
            file_url=d.file_url,
            body=d.body,
            created_at=d.created_at.isoformat(),
        )
        for d in docs
    ]


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: CreateDocumentRequest,
    admin: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
):
    doc = Document(
        id=new_id(),
        title=payload.title,
        category=payload.category,
        file_url=payload.file_url,
        body=payload.body,
        society_id=admin.society_id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        category=doc.category,
        file_url=doc.file_url,
        body=doc.body,
        created_at=doc.created_at.isoformat(),
    )
