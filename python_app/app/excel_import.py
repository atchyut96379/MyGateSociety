import re
from typing import Any

from sqlalchemy.orm import Session

from .models import User
from .security import normalize_phone

HEADER_ALIASES: dict[str, list[str]] = {
    "name": ["name", "resident", "resident_name", "full_name"],
    "phone": ["phone", "mobile", "mobile_number", "contact", "contact_number"],
    "flat": ["flat", "flat_no", "flat_number", "flatno", "unit", "flat_no."],
    "role": ["role", "user_role"],
    "resident_type": ["resident_type", "residenttype", "type"],
    "committee_role": ["committee_role", "committee", "committee_role_"],
    "email": ["email", "e_mail"],
}


def _normalize_header(value: Any) -> str:
    return str(value or "").strip().lower().replace(" ", "_")


def _cell_str(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def _find_header_row(rows: list[tuple]) -> int:
    for idx, row in enumerate(rows[:5]):
        for cell in row:
            if _normalize_header(cell) in HEADER_ALIASES["name"]:
                return idx
    return 0


def build_column_map(header_row: tuple) -> dict[str, Any]:
    col_map: dict[str, int] = {}
    owner_col: int | None = None
    tenant_col: int | None = None

    for i, raw in enumerate(header_row):
        nh = _normalize_header(raw)
        if not nh:
            continue
        for field, aliases in HEADER_ALIASES.items():
            if nh in aliases:
                col_map[field] = i
        if nh == "owner":
            owner_col = i
        if nh == "tenant":
            tenant_col = i

    # "Resident Type" merged header often sits only on the first of two columns (Owner | Tenant).
    if owner_col is None and tenant_col is None and "resident_type" in col_map:
        idx = col_map["resident_type"]
        owner_col = idx
        tenant_col = idx + 1

    return {"fields": col_map, "owner_col": owner_col, "tenant_col": tenant_col}


def _get_cell(row: tuple, index: int | None) -> str:
    if index is None or index >= len(row):
        return ""
    return _cell_str(row[index])


def parse_phone_value(raw: str, flat_label: str, db: Session, society_id: str) -> str:
    if raw:
        first = re.split(r"[/|,;]", raw)[0].strip()
        digits = normalize_phone(first)
        if len(digits) >= 10:
            return digits[-10:]

    flat_digits = re.sub(r"\D", "", flat_label) or "0"
    base = f"88{flat_digits.zfill(8)}"[:10]
    candidate = base
    suffix = 0
    while (
        db.query(User)
        .filter(User.society_id == society_id, User.phone == candidate)
        .first()
    ):
        suffix += 1
        candidate = f"88{flat_digits.zfill(6)}{suffix:02d}"[:10]
    return candidate


def parse_resident_type(row: tuple, mapping: dict[str, Any]) -> str:
    fields = mapping["fields"]
    owner_col = mapping["owner_col"]
    tenant_col = mapping["tenant_col"]

    if "resident_type" in fields:
        mapped = _map_resident_type_label(_get_cell(row, fields["resident_type"]))
        if mapped:
            return mapped

    owner_val = _get_cell(row, owner_col).lower() if owner_col is not None else ""
    tenant_val = _get_cell(row, tenant_col).lower() if tenant_col is not None else ""

    if tenant_val == "tenant" and owner_val != "owner":
        return "TENANT"
    if owner_val == "owner" and tenant_val != "tenant":
        return "IN_HOUSE_OWNER"
    if owner_val == "owner" and tenant_val == "tenant":
        return "IN_HOUSE_OWNER"

    # Default to in-house owner when Owner/Tenant columns are blank
    return "IN_HOUSE_OWNER"


def _map_resident_type_label(raw: str) -> str | None:
    if not raw:
        return None
    key = raw.upper().replace(" ", "_").replace("-", "_")
    mapping = {
        "OWNER": "IN_HOUSE_OWNER",
        "IN_HOUSE_OWNER": "IN_HOUSE_OWNER",
        "INHOUSE_OWNER": "IN_HOUSE_OWNER",
        "OUT_HOUSE_OWNER": "OUT_HOUSE_OWNER",
        "OUTHOUSE_OWNER": "OUT_HOUSE_OWNER",
        "TENANT": "TENANT",
    }
    return mapping.get(key)


def parse_excel_row(
    row: tuple,
    row_num: int,
    mapping: dict[str, Any],
) -> dict[str, Any] | None:
    """Return parsed dict or None to skip empty/non-data rows."""
    fields = mapping["fields"]
    name = _get_cell(row, fields.get("name"))
    flat_label = _get_cell(row, fields.get("flat"))
    phone_raw = _get_cell(row, fields.get("phone"))
    role = _get_cell(row, fields.get("role")).upper() or "RESIDENT"
    email = _get_cell(row, fields.get("email")) or None
    committee_role = _get_cell(row, fields.get("committee_role")).upper() or None

    if not name and not flat_label and not phone_raw:
        return None

    if name.lower() in {"owner", "tenant", "name"} and not flat_label:
        return None

    if not name:
        return {"error": "Name is required", "row": row_num, "name": "—", "phone": phone_raw}

    if not flat_label and role in {"RESIDENT", "COMMITTEE"}:
        return {"error": "Flat number is required", "row": row_num, "name": name, "phone": phone_raw}

    resident_type = parse_resident_type(row, mapping)

    return {
        "name": name,
        "phone_raw": phone_raw,
        "flat_label": flat_label,
        "role": role,
        "resident_type": resident_type,
        "committee_role": committee_role or None,
        "email": email,
        "row": row_num,
    }
