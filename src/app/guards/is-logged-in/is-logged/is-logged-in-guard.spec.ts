import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, isObservable } from 'rxjs';
import { isLoggedInGuard } from './is-logged-in-guard';
import { LoginService } from '../../../services/login/login-service';
import { User } from '../../../models/user';

describe('isLoggedInGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => isLoggedInGuard(...guardParameters));

  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpMock.verify());

  it('allows navigation immediately when a user is already known, with no network call', () => {
    TestBed.inject(LoginService).user.set(Object.assign(new User(), { username: 'admin' }));

    const result = executeGuard({} as any, {} as any);

    expect(result).toBe(true);
    httpMock.expectNone('http://localhost:3000/me');
  });

  it('redirects to /login synchronously, with no network call, when already known to be logged out', () => {
    TestBed.inject(LoginService).user.set(null);

    const result = executeGuard({} as any, {} as any);

    expect(result).toEqual(router.createUrlTree(['login']));
    httpMock.expectNone('http://localhost:3000/me');
  });

  it('checks with the server when the user state is unknown, and allows navigation on success', async () => {
    const result = executeGuard({} as any, {} as any);
    expect(isObservable(result)).toBe(true);
    const resultPromise = firstValueFrom(result as any);

    httpMock
      .expectOne('http://localhost:3000/me')
      .flush({ username: 'admin', firstname: 'Super', lastname: 'Admin' });

    expect(await resultPromise).toBe(true);
  });

  it('redirects to /login when the unknown-state check comes back unauthenticated', async () => {
    const result = executeGuard({} as any, {} as any);
    const resultPromise = firstValueFrom(result as any);

    httpMock
      .expectOne('http://localhost:3000/me')
      .flush({ error: 'unauthenticated' }, { status: 401, statusText: 'Unauthorized' });

    expect(await resultPromise).toEqual(router.createUrlTree(['login']));
  });
});
