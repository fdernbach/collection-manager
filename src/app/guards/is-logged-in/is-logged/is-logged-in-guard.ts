import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../../../services/login/login-service';
import { inject } from '@angular/core';
import { catchError, map } from 'rxjs';

// A CanActivateFn is inert on its own — Angular only runs it because it's
// listed in a route's `canActivate: [isLoggedInGuard]` array (see
// app.routes.ts). It must be referenced on every route that should require
// a logged-in user; routes that omit it (like 'login' itself) stay open.
export const isLoggedInGuard: CanActivateFn = (route, state) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  // loginService.user() has three possible states, each needing different
  // handling:
  //   - undefined: the initial value — we haven't asked the server yet
  //     (e.g. right after a page reload). We don't know the answer, so we
  //     have to go find out.
  //   - null: set explicitly by LoginService.logout() — we already KNOW,
  //     with certainty, that nobody is logged in. No need to ask the server
  //     again.
  //   - a User instance: already confirmed logged in.
  //
  // undefined and null must be checked separately (not lumped into one
  // "falsy user" check) because they call for different actions: undefined
  // triggers an async /me request to resolve the unknown, while null can
  // redirect immediately without a wasted round trip.
  if (loginService.user() == undefined) {
    // Ask the server (GET /me via LoginService.getUser()). map() turns a
    // successful response into `true`, letting the guarded navigation
    // proceed; catchError() runs on a 401 (no valid token attached by the
    // auth interceptor) when there's really no session at all.
    return loginService.getUser().pipe(
      map(_ => true),
      catchError(_ => router.navigate(['login']))
    )
  }

  if (loginService.user() == null) {
    router.navigate(['login']);
  }

  return true;
};
