import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // 'undefinedIfStale' keeps model()-based component state (e.g. CollectionDetail.searchText)
    // untouched when it has no matching route param/query param/data key — the default
    // 'alwaysUndefined' clobbers ANY declared component input with undefined on every
    // navigation, including inputs that were never meant to be route-bound.
    provideRouter(routes, withComponentInputBinding({ unmatchedInputBehavior: 'undefinedIfStale' }))
  ]
};
