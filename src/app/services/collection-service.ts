import { Service } from '@angular/core';
import { Collection } from '../models/collection';
import { CollectionItem } from '../models/collection-item';

@Service()
export class CollectionService {

  private collections: Collection[] = [];
  private currentId = 1;
  private currentItemIndex: {[key: number]: number} = {};

  constructor() {
    // Load persisted data on startup instead of always regenerating dummy data
    this.load();
  }

  private save() {
    // Persist the current collections to localStorage as JSON
    localStorage.setItem('collections', JSON.stringify(this.collections));
  }

  private load() {
    // Read the persisted collections, if any
    const collectionsJson = localStorage.getItem('collections');
    if (collectionsJson) {
      // Rebuild proper Collection instances (with working methods like copy()) from plain JSON objects
      this.collections = JSON.parse(collectionsJson).map((collectionJson: any) => {
        const collection = Object.assign(new Collection(), collectionJson);
        const itemsJson = collectionJson['items'] || [];
        // Rebuild proper CollectionItem instances the same way
        collection.items = itemsJson.map((item: any) => Object.assign(new CollectionItem(), item));
        return collection;
      });

      // Resume the collection id counter after the highest id already stored
      this.currentId = Math.max(...this.collections.map(collection => collection.id), 0) + 1;
      // Resume each collection's item id counter after its highest stored item id
      this.currentItemIndex = this.collections.reduce(
        (indexes: {[key: number]: number}, collection) => {
          indexes[collection.id] = Math.max(...collection.items.map(item => item.id), 0) + 1;
          return indexes;
        }, {}
      );
    } else {
      // Nothing persisted yet: seed with sample data and persist it
      this.generateDummyData();
      this.save();
    }
  }

  generateDummyData() {
    // Build the "coin" sample item
    const coin = new CollectionItem();
    coin.name = 'Pièce de 1972';
    coin.description = 'Pièce de 50 centimes de francs.';
    coin.rarity = 'Commune';
    coin.image = 'img/coin1.png';
    coin.price = 170;

    // Build the "stamp" sample item
    const stamp = new CollectionItem();
    stamp.name = 'Timbre 1800';
    stamp.description = 'Un vieux timbre';
    stamp.rarity = 'Rare';
    stamp.image = 'img/timbre1.png';
    stamp.price = 555;

    // "linx" keeps the CollectionItem model's default property values
    const linx = new CollectionItem();

    // Create the collection that will hold the sample items
    const defaultCollection = new Collection();
    defaultCollection.title = "Collection mix";

    // Register the collection, then attach each item to it
    const storedCollection = this.add(defaultCollection);
    this.addItem(storedCollection, coin);
    this.addItem(storedCollection, linx);
    this.addItem(storedCollection, stamp);
  }

  getAll(): Collection[] {
    // Return a defensive copy of every collection so callers can't mutate internal state
    return this.collections.map(collection => collection.copy());
  }

  get(collectionId: number): Collection | null {
    // Look up the collection by id
    const storedCopy = this.collections.find(
      collection => collection.id === collectionId
    );

    // Nothing found: report it as absent
    if (!storedCopy) return null;
    // Found: return a copy, not the internal reference
    return storedCopy.copy();
  }

  add(collection: Omit<Collection, 'id' | 'items'>): Collection {

    // Copy the incoming collection so we own our own instance
    const storedCopy = collection.copy();
    // Assign it the next available id
    storedCopy.id = this.currentId;
    // Store it internally
    this.collections.push(storedCopy);

    // Start this collection's item id counter at 1
    this.currentItemIndex[storedCopy.id] = 1;
    // Advance the next collection id
    this.currentId++;
    // Persist the change
    this.save();

    // Hand back a copy of what was stored
    return storedCopy.copy();
  }

  update(collection: Omit<Collection, 'items'>): Collection | null {
    // Find the existing collection with the same id
    const storedCopy = this.collections.find(
      c => c.id === collection.id
    );

    // Nothing to update: report it as absent
    if (!storedCopy) return null;

    // Merge the incoming fields onto the stored collection
    Object.assign(storedCopy, collection);
    // Persist the change
    this.save();
    // Return a copy of the updated collection
    return storedCopy.copy();

  }

  delete(collectionId: number): void {
    // Keep every collection except the one being deleted
    this.collections = this.collections.filter(
      collection => collection.id !== collectionId
    );
    // Persist the change
    this.save();
  }

  addItem(collection: Collection, item: CollectionItem): Collection | null {
    // Find the collection this item should be added to
    const storedCollection = this.collections.find(
      storedCollection => storedCollection.id === collection.id
    );

    // Unknown collection: nothing to add to
    if (!storedCollection) return null;

    // Copy the incoming item so we own our own instance
    const storedItem = item.copy();
    // Assign it the next id available within this collection
    storedItem.id = this.currentItemIndex[collection.id];
    // Store it inside the collection
    storedCollection.items.push(storedItem);

    // Advance this collection's item id counter
    this.currentItemIndex[collection.id]++;
    // Persist the change
    this.save();

    // Return a copy of the updated collection
    return storedCollection.copy();
  }

  updateItem(collection: Collection, item: CollectionItem) {
    // Find the collection the item belongs to
    const storedCollection = this.collections.find(
      storedCollection => storedCollection.id === collection.id
    );

    // Unknown collection: nothing to update
    if (!storedCollection) return null;

    // Locate the item's position within that collection
    const storedItemIndex = storedCollection.items.findIndex(
      storedItem => storedItem.id === item.id
    )

    // Item not found in the collection: nothing to update
    if (storedItemIndex === -1) return null;

    // Replace the stored item with a copy of the updated one
    storedCollection.items[storedItemIndex] = item.copy();
    // Persist the change
    this.save();
    // Return a copy of the updated collection
    return storedCollection.copy();
  }

  deleteItem(collectionId: number, itemId: number): Collection | null {
    // Find the collection the item should be removed from
    const storedCollection = this.collections.find(
      storedCollection => storedCollection.id === collectionId
    );

    // Unknown collection: nothing to delete from
    if (!storedCollection) return null;

    // Keep every item except the one being deleted
    storedCollection.items = storedCollection.items.filter(
      item => item.id !== itemId
    )
    // Persist the change
    this.save();

    // Return a copy of the updated collection
    return storedCollection.copy();
  }
}
