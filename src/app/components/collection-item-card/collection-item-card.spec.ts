import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CollectionItemCard } from './collection-item-card';

describe('CollectionItemCard', () => {
  let component: CollectionItemCard;
  let fixture: ComponentFixture<CollectionItemCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionItemCard],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionItemCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
