import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { TicketService } from '../../services/ticket.service';
import {
    Ticket,
    TicketCreate,
    TicketStatus
} from '../../models/ticket.model';

@Component({
    selector: 'app-ticket-list',
    standalone: true,
    imports: [FormsModule, RouterLink, DatePipe],
    templateUrl: './ticket-list.component.html'
})
export class TicketListComponent {

    private readonly ticketService = inject(TicketService);

    tickets = signal<Ticket[]>([]);
    loading = signal(false);
    saving = signal(false);
    error = signal('');

    search = signal('');
    statusFilter = signal('all');
    showCreateForm = signal(false);

    newTicket: TicketCreate = {
        title: '',
        description: ''
    };

    totalTickets = computed(() => this.tickets().length);

    openTickets = computed(() =>
        this.tickets().filter(t => t.status === 'open').length
    );

    inProgressTickets = computed(() =>
        this.tickets().filter(t => t.status === 'in_progress').length
    );

    resolvedTickets = computed(() =>
        this.tickets().filter(t => t.status === 'resolved').length
    );

    filteredTickets = computed(() => {
        const query = this.search().trim().toLowerCase();

        return this.tickets().filter(ticket => {
            const matchesSearch =
                ticket.title.toLowerCase().includes(query) ||
                ticket.description.toLowerCase().includes(query);

            const matchesStatus =
                this.statusFilter() === 'all' ||
                ticket.status === this.statusFilter();

            return matchesSearch && matchesStatus;
        });
    });

    constructor() {
        this.loadTickets();
    }

    loadTickets(): void {
        this.loading.set(true);
        this.error.set('');

        this.ticketService.getTickets().subscribe({
            next: tickets => {
                this.tickets.set(tickets);
                this.loading.set(false);
            },
            error: err => {
                this.error.set('Unable to load tickets: ' + err.message);
                this.loading.set(false);
            }
        });
    }

    createTicket(): void {
        if (
            this.newTicket.title.trim().length < 3 ||
            this.newTicket.description.trim().length < 5 ||
            this.saving()
        ) {
            return;
        }

        this.saving.set(true);
        this.error.set('');

        this.ticketService.createTicket(this.newTicket).subscribe({
            next: ticket => {
                this.tickets.update(tickets => [ticket, ...tickets]);

                this.newTicket = {
                    title: '',
                    description: ''
                };

                this.showCreateForm.set(false);
                this.saving.set(false);
            },
            error: err => {
                this.error.set('Unable to create ticket: ' + err.message);
                this.saving.set(false);
            }
        });
    }
}