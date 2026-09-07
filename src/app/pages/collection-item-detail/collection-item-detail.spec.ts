import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from '../../app.routes';
import { CollectionItemDetail } from './collection-item-detail';
import { LoginService } from '../../services/login/login-service';
import { User } from '../../models/user';
import { ICollectionItemDTO } from '../../interfaces/collection-item-dto';
import { ICollectionDTO } from '../../interfaces/collection-dto';

// An "integration" test: it drives the real Router (with the app's real route config)
// so CollectionItemDetail receives its `:id` input exactly the way it does in the running
// app, against the real CollectionService/CollectionItemService — but with a mocked HTTP
// backend (HttpTestingController) instead of a real server, so the test is deterministic
// and doesn't depend on anything actually running on localhost:3000.
describe('CollectionItemDetail (integration)', () => {
  let httpMock: HttpTestingController;

  const coinDTO: ICollectionItemDTO = {
    id: 1,
    name: 'Pièce de 1972',
    description: 'Pièce de 50 centimes de francs.',
    image: 'img/coin1.png',
    rarity: 'Common',
    price: 170,
    collectionId: 1,
  };

  const collectionDTO: ICollectionDTO = {
    id: 1,
    title: 'Collection mix',
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        // Same router config and options as the real app (see app.config.ts)
        provideRouter(routes, withComponentInputBinding({ unmatchedInputBehavior: 'undefinedIfStale' })),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);

    // '/item' routes are guarded by isLoggedInGuard. Setting the shared `user`
    // signal directly (rather than actually logging in over HTTP) puts the
    // guard straight into its "already confirmed logged in" branch, so it
    // resolves synchronously with no backend involved.
    TestBed.inject(LoginService).user.set(Object.assign(new User(), { username: 'test-user' }));
  });

  afterEach(() => httpMock.verify());

  it('loads the matching item into the form when navigating to /item/:id', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/item/1', CollectionItemDetail);

    httpMock.expectOne('http://localhost:3000/items/1').flush(coinDTO);
    // itemCollection$ fires right behind collectionItem$ to load the item's own collection.
    httpMock.expectOne('http://localhost:3000/collections/1').flush(collectionDTO);
    await harness.fixture.whenStable();

    expect(component.itemFormGroup.value.name).toBe('Pièce de 1972');
    expect(component.itemFormGroup.value.price).toBe(170);
  });

  it('starts with a blank form when navigating to /item (create mode)', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/item', CollectionItemDetail);
    await harness.fixture.whenStable();

    expect(component.itemId()).toBeNull();
    expect(component.itemFormGroup.value.name).toBe('');
  });

  it('navigates to /not-found when the item id does not match any stored item', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/item/999', CollectionItemDetail);

    httpMock
      .expectOne('http://localhost:3000/items/999')
      .flush({ error: 'not found' }, { status: 404, statusText: 'Not Found' });
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/not-found');
  });

  it('deletes the item and navigates back when a deletion is confirmed', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/item/1', CollectionItemDetail);
    httpMock.expectOne('http://localhost:3000/items/1').flush(coinDTO);
    httpMock.expectOne('http://localhost:3000/collections/1').flush(collectionDTO);
    await harness.fixture.whenStable();

    component.confirmDeletion();
    httpMock.expectOne({ url: 'http://localhost:3000/items/1', method: 'DELETE' }).flush(null);
    await harness.fixture.whenStable();

    // navigateBack() navigates to '/', which app.routes.ts redirects to '/collection'.
    expect(TestBed.inject(Router).url).toBe('/collection');
  });
});
