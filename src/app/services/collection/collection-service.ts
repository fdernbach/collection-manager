import { inject, Service, signal } from '@angular/core';
import { Collection } from '../../models/collection';
import { HttpClient } from '@angular/common/http';
import { ICollectionDTO } from '../../interfaces/collection-dto';
import { map, Observable } from 'rxjs';

@Service()
export class CollectionService {

  private BASE_URL = 'http://localhost:3000';
  private COLLECTION_ENDPOINT = this.BASE_URL + '/collections';
  private http = inject(HttpClient);
  // App-wide "currently active collection", shared across components rather than
  // duplicated per page. Written by MainMenu (select(), and loadSelectedCollection()'s
  // startup/localStorage-restore logic); read by CollectionDetail (to redirect back to
  // it when the route carries no :id) and CollectionItemDetail (seeds its own
  // selectedCollection linkedSignal from this, and — once itemCollection$ is
  // subscribed — keeps it updated to match whichever item is being viewed).
  selectedCollection = signal<Collection | null>(null);

  // Fetches every collection, each with its items nested (see Collection.fromDTO).
  // Used by MainMenu to populate the sidebar list and as the fallback source for
  // loadSelectedCollection() when nothing is stored in localStorage yet.
  getAll(): Observable<Collection[]> {
    return this.http.get<ICollectionDTO[]>(this.COLLECTION_ENDPOINT, {}).pipe(
      map(collectionListData =>
        collectionListData.map(collectionData => Collection.fromDTO(collectionData))
      ))
  }

  // Fetches a single collection by id. Used by MainMenu when the user picks a
  // collection (or on startup restore), by CollectionDetail's selectedCollection$
  // (driven by the route's :id param), and by CollectionItemDetail's itemCollection$
  // to load the collection an item belongs to.
  get(id: number): Observable<Collection> {
    const url = `${this.COLLECTION_ENDPOINT}/${id}`;
    return this.http.get<ICollectionDTO>(url).pipe(
      map(collectionData => Collection.fromDTO(collectionData))
    )
  }
}