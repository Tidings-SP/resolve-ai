import uuid

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TicketCreate(BaseModel):

    title: str = Field(min_length=3, max_length=255)

    description: str = Field(min_length=5)



class TicketResponse(BaseModel):

    id: uuid.UUID

    title: str

    description: str

    status: str

    priority: str

    customer_id: uuid.UUID

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)