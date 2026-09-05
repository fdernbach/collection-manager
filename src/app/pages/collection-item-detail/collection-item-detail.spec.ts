import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { CollectionItemDetail } from './collection-item-detail';
import { CollectionService } from '../../services/collection/collection-service';
import { LoginService } from '../../services/login/login-service';
import { User } from '../../models/user';

// An "integration" test: it drives the real Router (with the app's real route config)
// so CollectionItemDetail receives its `:id` input exactly the way it does in the running
// app, against the real CollectionService/localStorage — not a fake ActivatedRoute or a
// mocked service.
describe('CollectionItemDetail (integration)', () => {
  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        // Same router config and options as the real app (see app.config.ts)
        provideRouter(routes, withComponentInputBinding({ unmatchedInputBehavior: 'undefinedIfStale' })),
      ],
    });

    // '/item' routes are guarded by isLoggedInGuard. Setting the shared `user`
    // signal directly (rather than actually logging in over HTTP) puts the
    // guard straight into its "already confirmed logged in" branch, so it
    // resolves synchronously with no backend involved.
    TestBed.inject(LoginService).user.set(Object.assign(new User(), { username: 'test-user' }));
  });

  it('loads the matching item into the form when navigating to /item/:id', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/item/1', CollectionItemDetail);
    harness.detectChanges();

    expect(component.itemFormGroup.value.name).toBe('Pièce de 1972');
    expect(component.itemFormGroup.value.price).toBe(170);
  });

  it('starts with a blank form when navigating to /item (create mode)', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/item', CollectionItemDetail);
    harness.detectChanges();

    expect(component.itemId()).toBeNull();
    expect(component.itemFormGroup.value.name).toBe('');
  });

  it('redirects to not-found when the id does not match any stored item', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/item/999');
    harness.detectChanges();
    // The redirect is triggered from inside an effect(), which runs asynchronously
    // relative to navigation — wait for it to settle before checking the URL.
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/not-found');
  });

  it('deletes the item and navigates home when a deletion is confirmed', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/item/1', CollectionItemDetail);
    harness.detectChanges();

    component.confirmDeletion();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/home');
    const remainingIds = TestBed.inject(CollectionService).getAll()[0].items.map((item) => item.id);
    expect(remainingIds).not.toContain(1);
  });
});
