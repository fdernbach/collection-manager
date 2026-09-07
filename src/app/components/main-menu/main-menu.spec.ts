import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MainMenu } from './main-menu';

describe('MainMenu', () => {
  let component: MainMenu;
  let fixture: ComponentFixture<MainMenu>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    // Force loadSelectedCollection() to find nothing stored, rather than reusing
    // state left over from a previous test.
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [MainMenu],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MainMenu);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // CollectionService.getAll() is fired immediately at construction (see
    // `collections = toSignal(...)`), so it must be flushed before the fixture
    // can settle.
    httpMock.expectOne('http://localhost:3000/collections').flush([]);
    await fixture.whenStable();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
