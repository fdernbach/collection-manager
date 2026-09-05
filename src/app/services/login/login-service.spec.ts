import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LK_TOKEN, LoginService } from './login-service';
import { User } from '../../models/user';

describe('LoginService', () => {
  let service: LoginService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(LoginService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Fails the test if any request went unhandled — catches a test that
    // forgot to flush a request the service actually made.
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login()', () => {
    it('POSTs the credentials and stores the returned token under LK_TOKEN', () => {
      let completed = false;
      service.login({ username: 'admin', password: 'admin1234' }).subscribe(() => (completed = true));

      const req = httpMock.expectOne('http://localhost:3000/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'admin', password: 'admin1234' });

      req.flush({ token: 'fake-jwt' });

      expect(completed).toBe(true);
      expect(localStorage.getItem(LK_TOKEN)).toBe('fake-jwt');
    });

    it('leaves localStorage untouched when the backend rejects the credentials', () => {
      let erroredStatus: number | undefined;
      service.login({ username: 'admin', password: 'wrong' }).subscribe({
        error: (err) => (erroredStatus = err.status),
      });

      httpMock
        .expectOne('http://localhost:3000/login')
        .flush({ error: 'invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      expect(erroredStatus).toBe(401);
      expect(localStorage.getItem(LK_TOKEN)).toBeNull();
    });
  });

  describe('getUser()', () => {
    it('GETs /me, turns the response into a real User, updates the signal, and re-emits it', () => {
      let emitted: User | null | undefined;
      service.getUser().subscribe((user) => (emitted = user));

      const req = httpMock.expectOne('http://localhost:3000/me');
      expect(req.request.method).toBe('GET');
      req.flush({ username: 'admin', firstname: 'Super', lastname: 'Admin' });

      expect(service.user()).toBeInstanceOf(User);
      expect(service.user()?.firstname).toBe('Super');
      // map(() => this.user()) re-emits the signal's own value, not the raw response
      expect(emitted).toBe(service.user());
    });
  });

  describe('logout()', () => {
    it('POSTs to /logout and clears both the stored token and the user signal', () => {
      localStorage.setItem(LK_TOKEN, 'some-token');
      service.user.set(Object.assign(new User(), { firstname: 'Super' }));

      let completed = false;
      service.logout().subscribe(() => (completed = true));

      const req = httpMock.expectOne('http://localhost:3000/logout');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });

      expect(completed).toBe(true);
      expect(localStorage.getItem(LK_TOKEN)).toBeNull();
      expect(service.user()).toBeNull();
    });
  });
});
