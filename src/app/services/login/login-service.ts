import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { map, tap } from 'rxjs';
import { User } from '../../models/user';

export interface LoginCredentialsDTO {
    username: string;
    password: string;
}

// Exported so the auth-token interceptor reads the token from the same key
// this service writes it to.
export const LK_TOKEN = 'TOKEN';

@Service()
export class LoginService {

    private BASE_URL = 'http://localhost:3000';
    private http = inject(HttpClient);
    user = signal<User | null | undefined>(undefined);

    login(credentials: LoginCredentialsDTO) {
        // http.post() does NOT send the request yet. It returns a "cold" Observable:
        // a description of the HTTP call that only actually runs once something
        // subscribes to it (e.g. `this.loginService.login(...).subscribe(...)` in a component).
        return this.http.post(this.BASE_URL + "/login", credentials).pipe(
            // .pipe() chains RxJS operators between the source Observable and the
            // subscriber. Each operator can inspect, transform, or react to emitted
            // values before they continue downstream.
            //
            // tap() is a "side effect" operator: it runs this callback for every value
            // that flows through, but re-emits the SAME value unchanged (unlike map(),
            // which would transform it). Here we use it to save the token as a side
            // effect, while the raw HTTP response still reaches whoever calls .subscribe().
            tap((result: any) => {
                localStorage.setItem(LK_TOKEN, result['token']);
            })
        );
    }

    getUser() {
        // Same cold-Observable rule as login(): GET /me isn't fired until something
        // subscribes. The backend's /me route reads the current user from the
        // bearer token on the request (see the `auth` middleware server-side).
        return this.http.get(this.BASE_URL + '/me').pipe(
            // tap() again: a side effect, not a transform. Turn the raw JSON body
            // into a real User instance and push it into the `user` signal so any
            // component reading `loginService.user()` reacts automatically.
            tap((result: any) => {
                const user = Object.assign(new User(), result);
                this.user.set(user);
            }),
            // map() DOES transform the emitted value (unlike tap). We swap out the
            // raw HTTP response and re-emit `this.user()` instead, so whoever
            // subscribes to getUser() receives the User instance we just built,
            // not the plain JSON object the server sent.
            map(() => this.user())
        );
    }

    logout() {
        // Same shape as login()/getUser(): builds a POST /logout request with a
        // tap() side effect to clear local session state once the server confirms.
        return this.http.post(this.BASE_URL + '/logout', {}).pipe(
            tap(() => {
                localStorage.removeItem(LK_TOKEN);
                this.user.set(null);
            })
        );
    }
    
}
