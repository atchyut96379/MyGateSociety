# Marvel Rocks Society — Python + SQL Server

Self-hosted gated-community app (MyGate-style) using **Python (FastAPI)** and **SQL Server** only. No Node.js required for the backend.

## Project layout

```
MyGateSociety/
├── docker-compose.yml          # SQL Server Developer Edition
├── web/                        # React UI (Vite)
├── python_app/
│   ├── app/
│   │   ├── models.py           # all SQL Server tables (28)
│   │   ├── routers/            # API routes
│   │   ├── seed.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── setup.ps1
│   └── dev.ps1
├── scripts/
│   └── schema.sql              # SQL Server DDL
└── README.md
```

## Requirements

- Python 3.11+
- Docker Desktop (for SQL Server Developer Edition)

## Quick start (Windows)

**Terminal 1 — Python API:**

```powershell
cd python_app
.\setup.ps1    # Docker SQL Server + venv + tables + seed (or use local SQL Server)
.\dev.ps1      # API at http://localhost:8000
```

**Terminal 2 — React UI:**

```powershell
cd web
.\dev.ps1      # UI at http://localhost:3000 (proxies API calls to :8000)
```

Open **http://localhost:3000** for the full society app (login, admin, resident, guard).

**Full walkthrough with examples:** see [docs/APPLICATION_GUIDE.md](docs/APPLICATION_GUIDE.md)

**First login:** every new account must complete **profile + password setup** at `/setup` using the office password once. After that, sign in with the **new password** (mobile number unchanged). Live counters refresh every 5 seconds.

## Reset & initial Secretary login

```powershell
cd python_app
.\.venv\Scripts\python.exe -m app.seed --reset
```

| Field | Value |
|-------|-------|
| Login ID | `Admin` |
| Password | `admin` |
| Role | Secretary (Main Admin) |

**Login flow:**
1. **First time only:** Login ID `Admin` / password `admin` / role Secretary → complete setup with your **mobile number** (becomes permanent login ID).
2. **After setup:** Login screen shows **mobile number only** — `Admin` no longer works.

Only the Secretary can create resident/guard/committee logins (single form or **Excel bulk import**).

**Committee roles** (when creating users): President, Vice President, Joint Secretary, Treasurer, Member 1–5. Secretary is reserved for the main account.

## Flat layout

5 floors × 19 doors = **90 homes**. Duplex pairs **109/110**, **209/210**, … **509/510** each count as one flat.

## Connection string

```text
mssql+pymssql://sa:MyGate_Dev12345@localhost:1433/mygatesociety
```

## UI screens

| Role | Modules |
|------|---------|
| **Admin** | Users, notices, bills, finance (expenses + ledger), helpdesk, amenities, polls, events, documents, move in/out, emergency contacts, gate console |
| **Resident** | Visitors, deliveries, staff, vehicles, bills, amenities, polls, events, documents, move in/out, directory, helpdesk, kids exit, SOS, emergency, accounts, notifications, change password |
| **Guard** | OTP pad, visitor check-in, delivery actions, vehicle last-4 lookup, SOS alerts |

## API endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Service health |
| `POST /auth/login` | Login (JWT) |
| `GET/POST /visitors` | Visitor passes + check-in/out |
| `GET/POST /deliveries` | Delivery passes + status update |
| `GET /gate/lookup` | OTP lookup (visitor, delivery, staff, kid) |
| `GET/POST /staff` | Domestic staff + check-in |
| `GET/POST /vehicles` | Vehicles + last-4 lookup |
| `GET/POST /complaints` | Helpdesk tickets |
| `GET/POST /sos` | Security alerts |
| `GET/POST /kids-exit` | Child exit approval |
| `GET /emergency` | Emergency contacts |
| `GET /accounts/summary` | Society ledger summary |
| `GET/POST /bills` | Maintenance bills + generate + pay |
| `GET/POST /expenses` | Society expenses (admin) |
| `GET /transactions` | Ledger transactions |
| `GET/POST /amenities` | Amenities + bookings |
| `GET/POST /polls` | Polls + vote |
| `GET/POST /events` | Society events |
| `GET/POST /documents` | Bylaws, minutes, forms |
| `GET/POST /moves` | Move in/out requests |
| `GET/PATCH /directory` | Intercom directory |
| `GET /notifications` | In-app alerts |
| `POST /auth/change-password` | First-login password change |

## Database tables

`models.py` and `scripts/schema.sql` define **28 tables**: society, flats, users, visitors, deliveries, notices, complaints, domestic staff, vehicles, bills, amenities, polls, SOS, kid exit, accounts ledger, and more.

`setup.ps1` creates tables via SQLAlchemy (`python -m app.seed`). For SSMS, run `scripts/schema.sql` on the `mygatesociety` database, then run `python -m app.seed` for seed data.

## Features (same app, role-based)

| Module | Resident | Guard / Security |
|--------|----------|------------------|
| Visitor pre-invite + OTP | ✅ | Punch OTP at gate |
| Delivery approve/deny | ✅ | Collect parcel |
| Domestic staff passcode | ✅ | Entry/exit + notify |
| Vehicle lookup | Register | Last 4 digits → call owner |
| Kids checkout | Approve/deny | OTP exit |
| SOS | Raise alarm | Loud alert |
| Community | Notices, polls, bills, helpdesk | — |

## Manual setup

```powershell
# 1. Start SQL Server
docker compose up -d db

# 2. Python environment
cd python_app
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env

# 3. Create database, tables, seed
python -m app.seed

# 4. Run API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## SQL Server Developer Edition

Docker uses `MSSQL_PID=Developer` — free for local dev/test with full Enterprise features. For production, use Azure SQL or a licensed SQL Server edition.
