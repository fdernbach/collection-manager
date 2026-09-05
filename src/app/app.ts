import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LoginService } from './services/login/login-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [RouterOutlet, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnDestroy {

  private loginService = inject(LoginService);
  private router = inject(Router);

  // Re-exposing the service's own signal: app.html reads it as `user()` and
  // reacts whenever LoginService updates it. Nothing in this component
  // populates it on startup — isLoggedInGuard already fetches it (with proper
  // error handling) the moment any guarded route is activated, which covers
  // every case that matters (including a fresh page reload, since the guard
  // re-runs on the initial navigation too). A second, independent fetch here
  // used to race that one and had no error handling of its own — see git
  // history / code review notes if you're wondering why it's gone.
  protected user = this.loginService.user;

  private logoutSubscription: Subscription | null = null;

  ngOnDestroy(): void {
    this.logoutSubscription?.unsubscribe();
  }

  logout() {
    this.logoutSubscription = this.loginService.logout().subscribe({
      next: () => this.router.navigate(['login']),
      error: () => this.router.navigate(['login'])
    });
  }

}
