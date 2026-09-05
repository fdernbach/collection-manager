import { HttpInterceptorFn } from '@angular/common/http';
import { LK_TOKEN } from '../../services/login/login-service';

// This function isn't called directly anywhere in the app. It's wired into
// the HTTP pipeline in app.config.ts via provideHttpClient(withInterceptors([...])) —
// that registration is what makes Angular invoke it for every outgoing HttpClient
// request. A plain exported function like this, without that registration, would
// never run.
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  // LoginService stores the JWT under this same key (LK_TOKEN) when login()
  // succeeds. Reading it here, rather than a hardcoded string, keeps the two
  // in sync — see the LK_TOKEN export in login-service.ts.
  const token = localStorage.getItem(LK_TOKEN);
  let requestToSend = req;
  if (token) {
    // HttpRequest is immutable, so we can't mutate req.headers directly.
    // .set() returns a new HttpHeaders with the addition, and .clone() returns
    // a new HttpRequest carrying it — the original `req` is left untouched.
    const headers = req.headers.set('Authorization', 'Bearer ' + token);
    requestToSend = req.clone({ headers : headers });
  }
  // next() hands the (possibly modified) request to the next step in the
  // interceptor chain, ultimately reaching the network. Not calling next()
  // here would silently swallow every HTTP request in the app.
  return next(requestToSend);
};
