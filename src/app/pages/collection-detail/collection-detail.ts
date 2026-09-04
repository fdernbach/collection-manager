import { Component, computed, inject, model, signal } from '@angular/core';
import { Collection } from '../../models/collection';
import { CollectionService } from '../../services/collection-service';
import { CollectionItem } from '../../models/collection-item';
import { SearchBar } from '../../components/search-bar/search-bar';
import { CollectionItemCard } from '../../components/collection-item-card/collection-item-card';


@Component({
  imports: [SearchBar, CollectionItemCard],
  selector: 'app-collection-detail',
  styleUrl: './collection-detail.scss',
  templateUrl: './collection-detail.html',
})
export class CollectionDetail {

  private collectionService = inject(CollectionService);
  // Two-way bound to the search bar; drives the filter in collectionItems()
  searchText = model('');

  // Currently displayed collection (first one available, see constructor)
  selectedCollection = signal<Collection | null>(null);
  // Items of the selected collection, filtered by a case-insensitive name match against searchText
  collectionItems = computed(() => {
    const allItems = this.selectedCollection()?.items;
    return allItems?.filter(
      item => item.name.toLowerCase().includes(
        this.searchText().toLowerCase()));
  });

  constructor() {
    // Default to the first stored collection, if any exist
    const allCollections = this.collectionService.getAll();
    if (allCollections.length > 0) {
      this.selectedCollection.set(allCollections[0]);
    }
  }

  addGenericItem() {
    const collection = this.selectedCollection();
    if (collection) {
      // Persist a blank item, then refresh the signal with the service's copy
      // so the view reflects the item's newly assigned id
      const storedCollection = this.collectionService.addItem(
        collection, new CollectionItem());
      this.selectedCollection.set(storedCollection);
    }
  }

}
