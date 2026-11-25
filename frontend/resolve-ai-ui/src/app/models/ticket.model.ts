export type TicketStatus =
    | 'open'
    | 'in_progress'
    | 'resolved'
    | 'closed';

export type TicketPriority =
    | 'low'
    | 'medium'
    | 'high'
    | 'urgent';

export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    customer_id: string;
    created_at: string;
}

export interface TicketCreate {
    title: string;
    description: string;
    customer_id: string;
}

export interface TicketUpdate {
    status?: TicketStatus;
    priority?: TicketPriority;
}

export interface TicketMessage {
    id: string;
    ticket_id: string;
    author_id: string;
    body: string;
    created_at: string;
}

export interface TicketMessageCreate {
    author_id: string;
    body: string;
}

export interface TicketDetail extends Ticket {
    messages: TicketMessage[];
}