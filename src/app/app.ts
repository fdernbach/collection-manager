import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LK_TOKEN, LoginService } from './services/login/login-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [RouterOutlet, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit, OnDestroy {

  private loginService = inject(LoginService);
  private router = inject(Router);

  // Re-exposing the service's own signal: app.html reads it as `user()` and
  // reacts whenever LoginService updates it (on getUser() success or logout()).
  protected user = this.loginService.user;

  private logoutSubscription: Subscription | null = null;

  ngOnInit() {
    // `user` starts out undefined until something populates it. Fetch it once
    // on app startup — but only if a token is actually stored, otherwise this
    // fires a doomed /me request (and a console 401) on every visit to /login.
    if (localStorage.getItem(LK_TOKEN)) {
      this.loginService.getUser().subscribe();
    }
  }

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
