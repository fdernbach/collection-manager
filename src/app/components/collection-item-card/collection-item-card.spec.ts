import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CollectionItemCard } from './collection-item-card';
import { CollectionItem } from '../../models/collection-item';

describe('CollectionItemCard', () => {
  let component: CollectionItemCard;
  let fixture: ComponentFixture<CollectionItemCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionItemCard],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionItemCard);
    // "item" is a required input; the component can't render without one.
    fixture.componentRef.setInput('item', new CollectionItem());
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
