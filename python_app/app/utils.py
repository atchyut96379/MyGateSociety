import random
import re

COMMITTEE_SUFFIX = {
    "PRESIDENT": "PRS",
    "VICE_PRESIDENT": "VPR",
    "SECRETARY": "ADM",
    "JOINT_SECRETARY": "JSC",
    "TREASURER": "TRS",
    "MEMBER_1": "MB1",
    "MEMBER_2": "MB2",
    "MEMBER_3": "MB3",
    "MEMBER_4": "MB4",
    "MEMBER_5": "MB5",
}


def association_prefix(association_name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]", "", association_name)
    if len(cleaned) < 4:
        cleaned = cleaned.ljust(4, "0")
    four = cleaned[:4]
    return four[0].upper() + four[1:].lower()


def default_user_password(
    association_name: str,
    role: str,
    flat_label: str | None = None,
    committee_role: str | None = None,
) -> str:
    prefix = association_prefix(association_name)
    if role == "RESIDENT" and flat_label:
        return f"{prefix}{flat_label}"
    if role == "SECURITY":
        return f"{prefix}SEC"
    if role == "ADMIN":
        return f"{prefix}ADM"
    if role == "COMMITTEE" and committee_role:
        return f"{prefix}{COMMITTEE_SUFFIX.get(committee_role, '000')}"
    return f"{prefix}000"


def generate_otp(length: int = 6) -> str:
    return "".join(random.choice("0123456789") for _ in range(length))


def new_id() -> str:
    from uuid import uuid4

    return uuid4().hex
