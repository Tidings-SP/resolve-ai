import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  imports: [RouterLink, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('resolve-ai-ui');
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logoutError = signal('');

  async logout(): Promise<void> {

    this.logoutError.set('');

    try {
      await this.auth.logout();
      await this.router.navigate(['/login']);

    } catch {
      this.logoutError.set('Unable to sign out');
    }
  }

}
