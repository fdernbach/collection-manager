import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from '../../app.routes';
import { Login } from './login';
import { LK_TOKEN } from '../../services/login/login-service';

// An "integration" test: renders the real Login component with its real Reactive Form
// and the real LoginService, against a mocked HTTP backend (HttpTestingController) — so
// it exercises the actual flow (submit -> POST /login -> GET /me -> navigate) the same
// way the running app does, just with a fake network instead of the real backend.
describe('Login (integration)', () => {
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let router: Router;

  function fillForm(username: string, password: string) {
    const usernameInput: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[formcontrolname="username"]'
    );
    const passwordInput: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[formcontrolname="password"]'
    );
    usernameInput.value = username;
    usernameInput.dispatchEvent(new Event('input'));
    passwordInput.value = password;
    passwordInput.dispatchEvent(new Event('input'));
  }

  function submit() {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
  }

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('disables the submit button until both fields are filled', async () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);

    fillForm('admin', 'admin1234');
    await fixture.whenStable();

    expect(button.disabled).toBe(false);
  });

  it('shows "Invalid credentials" and stores no token when the backend rejects the login', async () => {
    fillForm('admin', 'wrong');
    await fixture.whenStable();
    submit();

    httpMock
      .expectOne('http://localhost:3000/login')
      .flush({ error: 'invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(fixture.componentInstance.invalidCredentials()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Invalid credentials');
    expect(localStorage.getItem(LK_TOKEN)).toBeNull();
  });

  it('stores the token, fetches the user, and navigates to /home on a successful login', async () => {
    fillForm('admin', 'admin1234');
    await fixture.whenStable();
    submit();

    httpMock.expectOne('http://localhost:3000/login').flush({ token: 'fake-jwt' });
    await fixture.whenStable();

    httpMock
      .expectOne('http://localhost:3000/me')
      .flush({ username: 'admin', firstname: 'Super', lastname: 'Admin' });
    await fixture.whenStable();

    expect(localStorage.getItem(LK_TOKEN)).toBe('fake-jwt');
    expect(router.url).toBe('/home');
  });
});
