from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Poll, PollOption, PollVote, User
from ..schemas import CreatePollRequest, PollOptionResponse, PollResponse, VotePollRequest
from ..security import get_current_user, require_roles
from ..utils import new_id

router = APIRouter(prefix="/polls", tags=["polls"])


def poll_response(poll: Poll, db: Session, user_id: str | None) -> PollResponse:
    options_out: list[PollOptionResponse] = []
    voted_option_id = None

    for opt in poll.options:
        count = db.query(func.count(PollVote.id)).filter(PollVote.option_id == opt.id).scalar()
        options_out.append(PollOptionResponse(id=opt.id, text=opt.text, vote_count=int(count or 0)))
        if user_id:
            vote = (
                db.query(PollVote)
                .filter(PollVote.poll_id == poll.id, PollVote.user_id == user_id)
                .first()
            )
            if vote and vote.option_id == opt.id:
                voted_option_id = opt.id

    if user_id:
        vote = db.query(PollVote).filter(PollVote.poll_id == poll.id, PollVote.user_id == user_id).first()
        if vote:
            voted_option_id = vote.option_id

    return PollResponse(
        id=poll.id,
        question=poll.question,
        ends_at=poll.ends_at.isoformat(),
        options=options_out,
        user_voted_option_id=voted_option_id,
    )


@router.get("", response_model=list[PollResponse])
def list_polls(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    polls = (
        db.query(Poll)
        .filter(Poll.society_id == current_user.society_id)
        .order_by(Poll.created_at.desc())
        .limit(20)
        .all()
    )
    return [poll_response(p, db, current_user.id) for p in polls]


@router.post("", response_model=PollResponse, status_code=status.HTTP_201_CREATED)
def create_poll(
    payload: CreatePollRequest,
    admin: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
):
    if len(payload.options) < 2:
        raise HTTPException(status_code=400, detail="At least 2 options required")

    poll = Poll(
        id=new_id(),
        question=payload.question,
        ends_at=datetime.fromisoformat(payload.ends_at.replace("Z", "+00:00")),
        society_id=admin.society_id,
    )
    db.add(poll)
    db.flush()
    for text in payload.options:
        db.add(PollOption(id=new_id(), text=text, poll_id=poll.id))
    db.commit()
    db.refresh(poll)
    return poll_response(poll, db, None)


@router.post("/{poll_id}/vote", response_model=PollResponse)
def vote_poll(
    poll_id: str,
    payload: VotePollRequest,
    current_user: User = Depends(require_roles("RESIDENT", "COMMITTEE")),
    db: Session = Depends(get_db),
):
    poll = db.get(Poll, poll_id)
    if poll is None:
        raise HTTPException(status_code=404, detail="Poll not found")

    existing = (
        db.query(PollVote).filter(PollVote.poll_id == poll_id, PollVote.user_id == current_user.id).first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already voted")

    db.add(
        PollVote(
            id=new_id(),
            poll_id=poll_id,
            option_id=payload.option_id,
            user_id=current_user.id,
        )
    )
    db.commit()
    db.refresh(poll)
    return poll_response(poll, db, current_user.id)
