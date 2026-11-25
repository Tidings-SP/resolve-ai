import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.models.ticket import (
    Ticket,
    TicketDetailResponse,
    TicketMessageCreate,
    TicketMessageResponse,
    TicketUpdate,
)
from app.models.ticket_message import TicketMessage

from app.schemas.ticket import TicketCreate, TicketResponse

router = APIRouter()


@router.get("/check")
def database_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))

    return {
        "database": "connected",
        "message": "ResolveAI database connection successful"
    }


@router.post("/tickets", response_model=TicketResponse)
def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db)
):
    customer = db.get(User, ticket_data.customer_id)

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    ticket = Ticket(
        title=ticket_data.title,
        description=ticket_data.description,
        customer_id=ticket_data.customer_id
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket


@router.get("/tickets", response_model=list[TicketResponse])
def get_tickets(db: Session = Depends(get_db)):
    return db.query(Ticket).order_by(Ticket.created_at.desc()).all()


@router.get("/tickets/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket(ticket_id: uuid.UUID, db: Session = Depends(get_db)):
    ticket = db.get(Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return ticket


@router.patch("/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: uuid.UUID,
    ticket_data: TicketUpdate,
    db: Session = Depends(get_db)
):
    ticket = db.get(Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

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
    db: Session = Depends(get_db)
):
    ticket = db.get(Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    author = db.get(User, message_data.author_id)

    if author is None:
        raise HTTPException(status_code=404, detail="Message author not found")

    message = TicketMessage(
        ticket_id=ticket.id,
        author_id=author.id,
        body=message_data.body
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message


@router.get(
    "/tickets/{ticket_id}/messages",
    response_model=list[TicketMessageResponse]
)
def get_ticket_messages(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    ticket = db.get(Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return (
        db.query(TicketMessage)
        .filter(TicketMessage.ticket_id == ticket.id)
        .order_by(TicketMessage.created_at.asc())
        .all()
    )