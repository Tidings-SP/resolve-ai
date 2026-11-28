import uuid

from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.auth import CurrentUser, DbSession
from app.models.ticket import (
    Ticket,
    TicketDetailResponse,
    TicketMessageCreate,
    TicketMessageResponse,
    TicketUpdate,
)
from app.models.ticket_message import TicketMessage
from app.models.user import User, UserProfile
from app.schemas.ticket import TicketCreate, TicketResponse

router = APIRouter()


@router.get("/check")
def database_check(db: DbSession):
    db.execute(text("SELECT 1"))

    return {
        "database": "connected",
        "message": "ResolveAI database connection successful"
    }


@router.get("/me", response_model=UserProfile)
def get_profile(user: CurrentUser):
    return user


@router.post("/tickets", response_model=TicketResponse)
def create_ticket(ticket_data: TicketCreate, user: CurrentUser, db: DbSession):
    ticket = Ticket(
        title=ticket_data.title,
        description=ticket_data.description,
        customer_id=user.id,
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket


@router.get("/tickets", response_model=list[TicketResponse])
def get_tickets(user: CurrentUser, db: DbSession):
    tickets = db.query(Ticket)
    if user.role != "agent":
        tickets = tickets.filter(Ticket.customer_id == user.id)
    return tickets.order_by(Ticket.created_at.desc()).all()


def accessible_ticket(ticket_id: uuid.UUID, user: User, db: Session) -> Ticket:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None or (user.role != "agent" and ticket.customer_id != user.id):
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.get("/tickets/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket(ticket_id: uuid.UUID, user: CurrentUser, db: DbSession):
    return accessible_ticket(ticket_id, user, db)


@router.patch("/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: uuid.UUID,
    ticket_data: TicketUpdate,
    user: CurrentUser,
    db: DbSession,
):
    if user.role != "agent":
        raise HTTPException(status_code=403, detail="Only agents can update tickets")

    ticket = accessible_ticket(ticket_id, user, db)

    updates = ticket_data.model_dump(exclude_unset=True)

    if not updates or any(value is None for value in updates.values()):
        raise HTTPException(
            status_code=400,
            detail="Provide at least one non-null field to update"
        )

    for field, value in updates.items():
        setattr(ticket, field, value)

    db.commit()
    db.refresh(ticket)

    return ticket


@router.post(
    "/tickets/{ticket_id}/messages",
    response_model=TicketMessageResponse
)
def create_ticket_message(
    ticket_id: uuid.UUID,
    message_data: TicketMessageCreate,
    user: CurrentUser,
    db: DbSession,
):
    ticket = accessible_ticket(ticket_id, user, db)
    message = TicketMessage(
        ticket_id=ticket.id,
        author_id=user.id,
        body=message_data.body,
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message


@router.get(
    "/tickets/{ticket_id}/messages",
    response_model=list[TicketMessageResponse]
)
def get_ticket_messages(ticket_id: uuid.UUID, user: CurrentUser, db: DbSession):
    ticket = accessible_ticket(ticket_id, user, db)
    return (
        db.query(TicketMessage)
        .filter(TicketMessage.ticket_id == ticket.id)
        .order_by(TicketMessage.created_at.asc())
        .all()
    )
