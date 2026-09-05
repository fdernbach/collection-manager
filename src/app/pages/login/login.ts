import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LoginCredentialsDTO, LoginService } from '../../services/login/login-service';
import { Subscription } from 'rxjs';

@Component({
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login implements OnDestroy {

  private loginService = inject(LoginService);
  // Kept around so ngOnDestroy can unsubscribe if the component is destroyed
  // (e.g. the user navigates away) while the login request is still in flight.
  // Without this, the subscribe callbacks below could still fire later and
  // touch a component instance that no longer exists.
  private subscriptions = new Subscription();
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);

  // A Reactive Form: two controls, both required. The template disables the
  // submit button while this group is invalid, so login() only ever runs
  // with non-empty username/password.
  loginFormGroup = this.formBuilder.group({
    'username': ['', [Validators.required]],
    'password': ['', [Validators.required]]
  });

  // Drives the "Invalid credentials" message in login.html via `@if (invalidCredentials())`.
  invalidCredentials = signal(false);

  login(event: Event) {
    // loginService.login() only returns an Observable; nothing is sent over
    // the network until we subscribe here. Subscribing is also what actually
    // triggers the HTTP POST to /login.
    const loginSubscription = this.loginService.login(
      this.loginFormGroup.value as LoginCredentialsDTO
    ).subscribe({
      // 2xx response: the backend validated the credentials and returned a
      // JWT (saved to localStorage by the service's own tap()). That's a
      // token only, not the user's name — so success here means "go fetch
      // who this is", not "we're done".
      next: () => this.getUserInformation(),
      // Non-2xx response (401 for bad credentials): rxjs routes it to the
      // error branch instead of next.
      error: () => this.invalidCredentials.set(true)
    });
    // Subscription.add() collects subscriptions into one bag instead of a
    // separate field per request. ngOnDestroy() below can then unsubscribe
    // everything at once, regardless of how many requests login() ends up
    // firing over the component's lifetime.
    this.subscriptions.add(loginSubscription);
  }

  getUserInformation() {
    // login() only proved the credentials were valid; this is the actual
    // /me call that fills in loginService.user() (firstname/lastname/etc.)
    // so the app shell's nav has data to show as soon as we navigate home.
    const getUserSubscription = this.loginService.getUser().subscribe(user => {
      this.navigateHome();
    });
    this.subscriptions.add(getUserSubscription);
  }

  private navigateHome() {
    this.invalidCredentials.set(false);
    // No route guard exists yet on '/home' — this is a straight redirect,
    // not an authorization check. Protecting the route would be a CanActivate
    // guard that checks for a stored token.
    this.router.navigate(['home']);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
