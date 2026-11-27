import { Injectable, signal } from '@angular/core';

import {
    createClient,
    Session
} from '@supabase/supabase-js';

import { config } from '../core/config';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly supabase = createClient(
        config.supabaseUrl,
        config.supabasePublishableKey
    );

    readonly session = signal<Session | null>(null);

    constructor() {
        this.supabase.auth.onAuthStateChange(
            (_event, session) => {
                this.session.set(session);
            }
        );
    }

    async login(email: string, password: string) {

        const { data, error } =
            await this.supabase.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            throw error;
        }

        this.session.set(data.session);

        return data;
    }

    async getSession(): Promise<Session | null> {

        const { data, error } =
            await this.supabase.auth.getSession();

        if (error) {
            throw error;
        }

        return data.session;
    }

    async logout(): Promise<void> {

        const { error } =
            await this.supabase.auth.signOut();

        if (error) {
            throw error;
        }

        this.session.set(null);
    }
}