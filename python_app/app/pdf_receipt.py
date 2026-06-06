"""Generate maintenance payment receipt PDFs."""

from datetime import datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .models import MaintenanceBill, Society, SocietyTransaction, User


def _inr(amount: float) -> str:
    return f"₹{amount:,.2f}"


def build_receipt_pdf(
    bill: MaintenanceBill,
    society: Society,
    txn: SocietyTransaction | None,
    payer: User | None,
) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReceiptTitle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#0f766e"),
        spaceAfter=6,
    )
    muted = ParagraphStyle("Muted", parent=styles["Normal"], textColor=colors.grey, fontSize=10)

    flat_label = bill.flat.label if bill.flat else bill.flat_id
    paid_at = bill.paid_at or datetime.utcnow()
    payer_name = payer.name if payer else "—"
    method = txn.method if txn else "—"
    reference = txn.reference or (txn.id[:12] if txn else "—")

    story = [
        Paragraph(society.association_name, title_style),
        Paragraph("Maintenance Payment Receipt", styles["Heading2"]),
        Spacer(1, 8),
        Paragraph(f"Receipt no. <b>{bill.id[:12].upper()}</b>", styles["Normal"]),
        Paragraph(f"Date: {paid_at.strftime('%d %b %Y, %H:%M UTC')}", muted),
        Spacer(1, 16),
    ]

    rows = [
        ["Flat", flat_label],
        ["Billing period", bill.month],
        ["Description", bill.description or f"Maintenance {bill.month}"],
        ["Amount paid", _inr(bill.amount)],
        ["Payment method", method],
        ["Transaction ref.", reference],
        ["Paid by", payer_name],
        ["Status", "PAID"],
    ]
    table = Table(rows, colWidths=[45 * mm, 120 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 24))
    story.append(
        Paragraph(
            "This is a computer-generated receipt from the society management system.",
            muted,
        )
    )

    doc.build(story)
    return buffer.getvalue()
