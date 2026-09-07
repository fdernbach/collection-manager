import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { filter, switchMap, tap } from 'rxjs';
import { Collection } from '../../models/collection';
import { CollectionItem } from '../../models/collection-item';
import { CollectionService } from '../../services/collection/collection-service';
import { SearchBar } from '../../components/search-bar/search-bar';
import { CollectionItemCard } from '../../components/collection-item-card/collection-item-card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  imports: [SearchBar, CollectionItemCard, RouterLink, MatButtonModule],
  selector: 'app-collection-detail',
  styleUrl: './collection-detail.scss',
  templateUrl: './collection-detail.html',
})
export class CollectionDetail {

  private collectionService = inject(CollectionService);
  private router = inject(Router);
  // Two-way bound to the search bar; drives the filter in displayedItems()
  searchText = model('');

  collectionId = input<number | undefined, string | undefined>(undefined, {
    alias: 'id',
    transform: ((id: string | undefined) => id ? parseInt(id) : undefined)
  });
  
  selectedCollection$ = toObservable(this.collectionId).pipe(
    takeUntilDestroyed(),
    filter(id => id !== undefined),
    switchMap(id => this.collectionService.get(id)),
    tap(collection => {
      this.selectedCollection.set(collection);
    })
  );
  selectedCollection = signal<Collection | null>(null);
  // Items of the selected collection, filtered by a case-insensitive name match against searchText
  displayedItems = computed(() => {
    const allItems = this.selectedCollection()?.items || [];
    return allItems.filter(item =>
      item.name.toLowerCase().includes(
        (this.searchText() || '').toLocaleLowerCase()
      )
    );
  });

  constructor() {
    effect(() => {
      if (!this.collectionId() && this.collectionService.selectedCollection()) {
        this.router.navigate([
          'collection', this.collectionService.selectedCollection()?.id
        ]);
      }
    });

    this.selectedCollection$.subscribe();
  }

  addItem() {
    this.router.navigate(['item']);
  }

  openItem(item: CollectionItem) {
    this.router.navigate(['item', item.id]);
  }

}
