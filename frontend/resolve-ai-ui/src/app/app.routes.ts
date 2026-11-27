import { Routes } from '@angular/router';

import { LoginComponent }
    from './pages/login/login.component';

import { TicketListComponent }
    from './pages/ticket-list/ticket-list.component';

import { TicketDetailComponent }
    from './pages/ticket-detail/ticket-detail.component';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [

    {
        path: 'login',
        component: LoginComponent
    },

    {
        path: 'tickets',
        component: TicketListComponent,
        canActivate: [authGuard]
    },

    {
        path: 'tickets/:id',
        component: TicketDetailComponent,
        canActivate: [authGuard]
    },

    {
        path: '',
        redirectTo: 'tickets',
        pathMatch: 'full'
    },

    {
        path: '**',
        redirectTo: 'tickets'
    }

];