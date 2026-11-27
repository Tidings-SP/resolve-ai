import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { config } from '../core/config';
import { UserProfile } from '../models/ticket.model';

import {
    Ticket,
    TicketCreate,
    TicketDetail,
    TicketUpdate,
    TicketMessage,
    TicketMessageCreate
} from '../models/ticket.model';

@Injectable({
    providedIn: 'root'
})
export class TicketService {

    private readonly http = inject(HttpClient);

    private readonly apiUrl = `${config.apiUrl}/tickets`;

    getProfile(): Observable<UserProfile> {

        return this.http.get<UserProfile>(
            `${config.apiUrl}/me`
        );
    }

    getTickets(): Observable<Ticket[]> {
        return this.http.get<Ticket[]>(this.apiUrl);
    }

    getTicket(id: string): Observable<TicketDetail> {
        return this.http.get<TicketDetail>(
            `${this.apiUrl}/${id}`
        );
    }

    createTicket(data: TicketCreate): Observable<Ticket> {
        return this.http.post<Ticket>(
            this.apiUrl,
            data
        );
    }

    updateTicket(
        id: string,
        data: TicketUpdate
    ): Observable<Ticket> {
        return this.http.patch<Ticket>(
            `${this.apiUrl}/${id}`,
            data
        );
    }

    getMessages(id: string): Observable<TicketMessage[]> {
        return this.http.get<TicketMessage[]>(
            `${this.apiUrl}/${id}/messages`
        );
    }

    addMessage(
        id: string,
        data: TicketMessageCreate
    ): Observable<TicketMessage> {
        return this.http.post<TicketMessage>(
            `${this.apiUrl}/${id}/messages`,
            data
        );
    }
}