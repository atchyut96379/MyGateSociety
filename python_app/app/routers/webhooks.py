"""Public webhook endpoints (verified by provider signature, not JWT)."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..razorpay_client import razorpay_configured, verify_webhook_signature
from .bills import finalize_razorpay_payment

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/razorpay")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    if not razorpay_configured():
        raise HTTPException(status_code=503, detail="Razorpay is not configured")

    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing webhook signature")

    verify_webhook_signature(body, signature)

    try:
        payload = json.loads(body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc

    event = payload.get("event")
    if event != "payment.captured":
        return {"status": "ignored", "event": event}

    payment = payload.get("payload", {}).get("payment", {}).get("entity", {})
    order_id = payment.get("order_id")
    payment_id = payment.get("id")
    if not order_id or not payment_id:
        raise HTTPException(status_code=400, detail="Incomplete payment payload")

    notes = payment.get("notes") or {}
    bill_id = notes.get("bill_id")
    if not bill_id:
        from ..razorpay_client import fetch_order

        order = fetch_order(order_id)
        bill_id = order.get("notes", {}).get("bill_id") or order.get("receipt")

    if not bill_id:
        raise HTTPException(status_code=400, detail="Could not resolve bill from payment")

    result = finalize_razorpay_payment(
        db,
        bill_id=bill_id,
        order_id=order_id,
        payment_id=payment_id,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Bill not found")

    return {"status": "ok", "bill_id": bill_id}
