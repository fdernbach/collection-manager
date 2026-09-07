import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from '../../app.routes';
import { CollectionDetail } from './collection-detail';
import { LoginService } from '../../services/login/login-service';
import { User } from '../../models/user';
import { ICollectionDTO } from '../../interfaces/collection-dto';

// An "integration" test: unlike a pure unit test (which would mock CollectionService),
// this renders the real component tree (CollectionDetail + SearchBar + CollectionItemCard)
// against the real CollectionService, backed by a mocked HTTP backend (HttpTestingController)
// instead of a real server — so it verifies these pieces actually work together without
// depending on anything running on localhost:3000.
describe('CollectionDetail (integration)', () => {
  let harness: RouterTestingHarness;
  let httpMock: HttpTestingController;

  const collectionDTO: ICollectionDTO = {
    id: 1,
    title: 'Collection mix',
    items: [
      { id: 1, name: 'Pièce de 1972', description: 'Pièce de 50 centimes de francs.', image: 'img/coin1.png', rarity: 'Common', price: 170, collectionId: 1 },
      { id: 2, name: 'Linx', description: 'A legendary sword of unmatched sharpness and history.', image: 'img/linx2.png', rarity: 'Legendary', price: 199, collectionId: 1 },
      { id: 3, name: 'Timbre 1800', description: 'Un vieux timbre', image: 'img/timbre1.png', rarity: 'Rare', price: 555, collectionId: 1 },
    ],
  };

  function itemNames(): (string | null | undefined)[] {
    return Array.from(harness.fixture.nativeElement.querySelectorAll('.item-name'))
      .map((el) => (el as Element).textContent?.trim());
  }

  beforeEach(async () => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding({ unmatchedInputBehavior: 'undefinedIfStale' })),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    // '/collection' routes are guarded by isLoggedInGuard.
    TestBed.inject(LoginService).user.set(Object.assign(new User(), { username: 'test-user' }));

    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/collection/1', CollectionDetail);
    httpMock.expectOne('http://localhost:3000/collections/1').flush(collectionDTO);
    await harness.fixture.whenStable();
  });

  afterEach(() => httpMock.verify());

  it('renders every seeded item as a card', () => {
    expect(itemNames()).toEqual(['Pièce de 1972', 'Linx', 'Timbre 1800']);
  });

  it('filters items live as the user types in the search bar', async () => {
    const input: HTMLInputElement = harness.fixture.nativeElement.querySelector('#live-search');
    input.value = 'timbre';
    input.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();

    expect(itemNames()).toEqual(['Timbre 1800']);
  });

  it('shows "No item found" when the search matches nothing', async () => {
    const input: HTMLInputElement = harness.fixture.nativeElement.querySelector('#live-search');
    input.value = 'does-not-exist';
    input.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();

    expect(harness.fixture.nativeElement.textContent).toContain('No item found');
  });
});
