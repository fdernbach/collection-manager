import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authTokenInterceptor } from './interceptors/auth-token/auth-token-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // 'undefinedIfStale' keeps model()-based component state (e.g. CollectionDetail.searchText)
    // untouched when it has no matching route param/query param/data key — the default
    // 'alwaysUndefined' clobbers ANY declared component input with undefined on every
    // navigation, including inputs that were never meant to be route-bound.
    provideRouter(routes, withComponentInputBinding({ unmatchedInputBehavior: 'undefinedIfStale' })),
    // withInterceptors() registers functional interceptors on the app's HttpClient.
    // Every request made through HttpClient — from any service, anywhere in the
    // app — is routed through this list before it reaches the network, in the
    // order given here. authTokenInterceptor uses that hook to attach the stored
    // auth token to outgoing requests (see its own comments for how it does that).
    // Without this registration the interceptor function would just be dead code:
    // Angular has no other way of knowing it exists.
    provideHttpClient(withInterceptors([authTokenInterceptor]))
  ]
};
