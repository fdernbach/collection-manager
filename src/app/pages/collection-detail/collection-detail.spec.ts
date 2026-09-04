import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CollectionDetail } from './collection-detail';

// An "integration" test: unlike a pure unit test (which would mock CollectionService),
// this renders the real component tree (CollectionDetail + SearchBar + CollectionItemCard)
// against the real CollectionService, backed by a real (cleared) localStorage. It verifies
// that these pieces actually work together, not just in isolation.
describe('CollectionDetail (integration)', () => {
  let fixture: ComponentFixture<CollectionDetail>;

  function itemNames(): (string | null | undefined)[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.item-name'))
      .map((el) => (el as Element).textContent?.trim());
  }

  beforeEach(async () => {
    // Force CollectionService.load() to reseed dummy data instead of reusing state
    // left over from a previous test.
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [CollectionDetail],
      // routerLink bindings in the template need a Router to be present, even with no routes.
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionDetail);
    await fixture.whenStable();
  });

  it('renders every seeded item as a card', () => {
    expect(itemNames()).toEqual(['Pièce de 1972', 'Linx', 'Timbre 1800']);
  });

  it('filters items live as the user types in the search bar', async () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#live-search');
    input.value = 'timbre';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(itemNames()).toEqual(['Timbre 1800']);
  });

  it('shows "No item found" when the search matches nothing', async () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#live-search');
    input.value = 'does-not-exist';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No item found');
  });
});
