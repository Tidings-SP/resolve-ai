import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { TicketService } from '../../services/ticket.service';

import {
    TicketDetail,
    TicketStatus,
    TicketPriority
} from '../../models/ticket.model';

@Component({
    selector: 'app-ticket-detail',
    standalone: true,
    imports: [FormsModule, RouterLink, DatePipe],
    templateUrl: './ticket-detail.component.html'
})
export class TicketDetailComponent {

    private readonly route = inject(ActivatedRoute);
    private readonly ticketService = inject(TicketService);

    ticketId = this.route.snapshot.paramMap.get('id')!;

    ticket = signal<TicketDetail | null>(null);
    loading = signal(false);
    saving = signal(false);
    sending = signal(false);
    error = signal('');

    selectedStatus: TicketStatus = 'open';
    selectedPriority: TicketPriority = 'medium';

    authorId = '';
    messageBody = '';

    constructor() {
        this.loadTicket();
    }

    loadTicket(): void {
        this.loading.set(true);
        this.error.set('');

        this.ticketService.getTicket(this.ticketId).subscribe({
            next: ticket => {
                this.ticket.set(ticket);

                this.selectedStatus = ticket.status;
                this.selectedPriority = ticket.priority;
                this.authorId = ticket.customer_id;

                this.loading.set(false);
            },
            error: err => {
                this.error.set('Unable to load ticket: ' + err.message);
                this.loading.set(false);
            }
        });
    }

    updateTicket(): void {
        if (this.saving()) return;

        this.saving.set(true);
        this.error.set('');

        this.ticketService.updateTicket(this.ticketId, {
            status: this.selectedStatus,
            priority: this.selectedPriority
        }).subscribe({
            next: updated => {
                this.ticket.update(current =>
                    current ? { ...current, ...updated } : current
                );

                this.saving.set(false);
            },
            error: err => {
                this.error.set('Update failed: ' + err.message);
                this.saving.set(false);
            }
        });
    }

    sendMessage(): void {
        if (
            !this.messageBody.trim() ||
            !this.authorId.trim() ||
            this.sending()
        ) {
            return;
        }

        this.sending.set(true);
        this.error.set('');

        this.ticketService.addMessage(this.ticketId, {
            author_id: this.authorId,
            body: this.messageBody.trim()
        }).subscribe({
            next: message => {
                this.ticket.update(current => {
                    if (!current) return current;

                    return {
                        ...current,
                        messages: [...current.messages, message]
                    };
                });

                this.messageBody = '';
                this.sending.set(false);
            },
            error: err => {
                this.error.set('Unable to send message: ' + err.message);
                this.sending.set(false);
            }
        });
    }
}