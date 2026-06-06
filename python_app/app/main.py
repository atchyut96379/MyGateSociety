from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import (
    accounts,
    amenities,
    auth,
    bills,
    complaints,
    deliveries,
    directory,
    documents,
    emergency,
    events,
    expenses,
    flats,
    gate,
    health,
    kids_exit,
    moves,
    notices,
    notifications,
    polls,
    realtime,
    sos,
    staff,
    transactions,
    users,
    vehicles,
    visitors,
)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(flats.router)
app.include_router(users.router)
app.include_router(visitors.router)
app.include_router(deliveries.router)
app.include_router(notices.router)
app.include_router(gate.router)
app.include_router(staff.router)
app.include_router(vehicles.router)
app.include_router(complaints.router)
app.include_router(sos.router)
app.include_router(kids_exit.router)
app.include_router(emergency.router)
app.include_router(accounts.router)
app.include_router(bills.router)
app.include_router(expenses.router)
app.include_router(transactions.router)
app.include_router(amenities.router)
app.include_router(polls.router)
app.include_router(events.router)
app.include_router(documents.router)
app.include_router(moves.router)
app.include_router(directory.router)
app.include_router(notifications.router)
app.include_router(realtime.router)


@app.get("/")
def root():
    return {
        "service": settings.app_name,
        "stack": "python + sqlserver",
        "environment": settings.environment,
        "sqlserver_edition": settings.sqlserver_edition,
        "docs": "/docs",
        "health": "/health",
    }
