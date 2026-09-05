import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authTokenInterceptor } from './auth-token-interceptor';
import { LK_TOKEN } from '../../services/login/login-service';

describe('authTokenInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authTokenInterceptor])), provideHttpClientTesting()],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('attaches a Bearer Authorization header when a token is stored', () => {
    localStorage.setItem(LK_TOKEN, 'my-jwt');

    httpClient.get('/anything').subscribe();

    const req = httpMock.expectOne('/anything');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt');
    req.flush({});
  });

  it('sends no Authorization header when there is no stored token', () => {
    httpClient.get('/anything').subscribe();

    const req = httpMock.expectOne('/anything');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
