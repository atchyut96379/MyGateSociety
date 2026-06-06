from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Notice, User
from ..schemas import CreateNoticeRequest, NoticeResponse
from ..security import get_current_user, require_roles
from ..utils import new_id

router = APIRouter(prefix="/notices", tags=["notices"])


def notice_response(notice: Notice) -> NoticeResponse:
    return NoticeResponse(
        id=notice.id,
        title=notice.title,
        body=notice.body,
        pinned=notice.pinned,
        target_group=notice.target_group,
        society_id=notice.society_id,
        author_id=notice.author_id,
        author_name=notice.author.name if notice.author else None,
        created_at=notice.created_at.isoformat(),
    )


@router.get("", response_model=list[NoticeResponse])
def list_notices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notices = (
        db.query(Notice)
        .filter(Notice.society_id == current_user.society_id)
        .order_by(Notice.pinned.desc(), Notice.created_at.desc())
        .all()
    )
    return [notice_response(notice) for notice in notices]


@router.post("", response_model=NoticeResponse, status_code=201)
def create_notice(
    payload: CreateNoticeRequest,
    current_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
):
    notice = Notice(
        id=new_id(),
        title=payload.title,
        body=payload.body,
        pinned=payload.pinned or False,
        society_id=current_user.society_id,
        author_id=current_user.id,
    )
    db.add(notice)
    db.flush()

    from ..notify import notify_society_residents

    preview = notice.body[:240] + ("…" if len(notice.body) > 240 else "")
    notify_society_residents(
        db,
        current_user.society_id,
        type="NOTICE",
        title=f"Notice: {notice.title}",
        body=preview,
        dedupe_key=f"notice:{notice.id}",
    )

    db.commit()
    db.refresh(notice)
    return notice_response(notice)
