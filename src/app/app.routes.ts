import { Routes } from '@angular/router';
import { CollectionDetail } from './pages/collection-detail/collection-detail';
import { CollectionItemDetail } from './pages/collection-item-detail/collection-item-detail';
import { NotFound } from './pages/not-found/not-found';
import { Login } from './pages/login/login';
import { isLoggedInGuard } from './guards/is-logged-in/is-logged/is-logged-in-guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        component: CollectionDetail,
        // canActivate runs isLoggedInGuard before the router activates this
        // route. Returning `true` (or an Observable that emits `true`) lets
        // navigation continue; returning `false`/redirecting blocks it. Every
        // route that should require a logged-in user needs this listed
        // explicitly — it is NOT inherited by children or applied globally.
        canActivate: [isLoggedInGuard]
    },
    {
        path: 'item',
        children: [
            {
                path: '',
                component: CollectionItemDetail,
                // Same guard, repeated: a parent route's canActivate does not
                // protect its children automatically, so each protected leaf
                // route needs its own canActivate: [isLoggedInGuard] entry.
                canActivate: [isLoggedInGuard]
            },
            {
                path: ':id',
                component: CollectionItemDetail,
                canActivate: [isLoggedInGuard]
            }
        ]
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: '**',
        component: NotFound
    }
];
