from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.database import router as database_router

from app.database.connection import Base, engine

# Import models so SQLAlchemy registers their tables
from app.models.user import User
from app.models.ticket import Ticket
from app.models.ticket_message import TicketMessage

# Development-only table initialization
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="ResolveAI API",
    description="AI-powered customer support platform",
    version="0.2.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    health_router,
    prefix="/api/v1",
    tags=["Health"]
)

app.include_router(
    database_router,
    prefix="/api/v1",
    tags=["Database"]
)


@app.get("/")
async def root():

    return {
        "message": "Welcome to ResolveAI API",
        "version": "0.2.0"
    }