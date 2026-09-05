import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../../../services/login/login-service';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';

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
  //
  // Strict equality (===) matters here: `null == undefined` is true in JS,
  // so a loose `==` would make the undefined-branch below also swallow the
  // null case, and this null-check would never actually run.
  if (loginService.user() === undefined) {
    // Ask the server (GET /me via LoginService.getUser()). map() turns a
    // successful response into `true`, letting the guarded navigation
    // proceed. catchError() runs on a 401 (no valid token attached by the
    // auth interceptor) when there's really no session at all — it must
    // resolve to a UrlTree (via router.createUrlTree(), wrapped in of()
    // since catchError needs an Observable back), which the router treats
    // as "redirect here instead". Returning router.navigate()'s resolved
    // boolean here would be wrong: that boolean reports whether the
    // *imperative* navigation to /login succeeded, not whether this guard
    // should allow the original route — a successful redirect would
    // resolve to `true` and incorrectly let the guarded route through too.
    return loginService.getUser().pipe(
      map(_ => true),
      catchError(_ => of(router.createUrlTree(['login'])))
    )
  }

  if (loginService.user() === null) {
    // Returning the UrlTree directly (instead of calling router.navigate()
    // and returning true/false separately) lets the router redirect
    // synchronously as part of resolving this guard, with no separate
    // imperative navigation racing the guard's own result.
    return router.createUrlTree(['login']);
  }

  return true;
};
