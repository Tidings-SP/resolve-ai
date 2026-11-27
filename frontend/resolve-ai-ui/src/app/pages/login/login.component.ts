import {
    Component,
    inject,
    signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule],

    template: `
    <div class="login-container">

      <form
        class="panel login-card form-grid"
        (ngSubmit)="login()"
        #loginForm="ngForm">

        <h1>ResolveAI</h1>
        <p>Sign in to your support workspace.</p>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <label for="email">Email address</label>

        <input
          id="email"
          type="email"
          name="email"
          [(ngModel)]="email"
          autocomplete="email"
          required
          email
        />

        <label for="password">Password</label>

        <input
          id="password"
          type="password"
          name="password"
          [(ngModel)]="password"
          autocomplete="current-password"
          required
        />

        <button
          type="submit"
          [disabled]="loading() || loginForm.invalid">

          {{ loading() ? 'Signing in...' : 'Sign in' }}

        </button>

      </form>

    </div>
  `,

    styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 32px;
    }

    h1, p {
      text-align: center;
    }

    p {
      color: #64748b;
    }
  `]
})
export class LoginComponent {

    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    email = '';
    password = '';

    loading = signal(false);
    error = signal('');

    async login(): Promise<void> {

        if (this.loading()) return;

        this.loading.set(true);
        this.error.set('');

        try {

            await this.auth.login(
                this.email.trim(),
                this.password
            );

            this.password = '';

            await this.router.navigate(['/tickets']);

        } catch (err: unknown) {

            this.error.set(
                err instanceof Error
                    ? err.message
                    : 'Login failed'
            );

        } finally {

            this.loading.set(false);
        }
    }
}