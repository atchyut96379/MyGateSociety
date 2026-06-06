"""Razorpay order creation and payment verification."""

from __future__ import annotations

import razorpay
from fastapi import HTTPException

from .config import settings


def razorpay_configured() -> bool:
    return bool(settings.razorpay_key_id and settings.razorpay_key_secret)


def get_razorpay_client() -> razorpay.Client:
    if not razorpay_configured():
        raise HTTPException(
            status_code=503,
            detail="Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env",
        )
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


def create_maintenance_order(
    *,
    bill_id: str,
    amount_rupees: float,
    flat_label: str,
    month: str,
) -> dict:
    client = get_razorpay_client()
    amount_paise = int(round(amount_rupees * 100))
    if amount_paise < 100:
        raise HTTPException(status_code=400, detail="Amount too small for online payment")

    return client.order.create(
        {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": bill_id[:40],
            "notes": {
                "bill_id": bill_id,
                "flat": flat_label,
                "month": month,
            },
        }
    )


def verify_payment_signature(
    *,
    order_id: str,
    payment_id: str,
    signature: str,
) -> None:
    client = get_razorpay_client()
    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": signature,
            }
        )
    except razorpay.errors.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Payment verification failed") from exc


def fetch_order(order_id: str) -> dict:
    client = get_razorpay_client()
    return client.order.fetch(order_id)
