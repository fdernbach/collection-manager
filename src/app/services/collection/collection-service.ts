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
  selectedCollection = signal<Collection | null>(null);

  getAll(): Observable<Collection[]> {
    return this.http.get<ICollectionDTO[]>(this.COLLECTION_ENDPOINT, {}).pipe(
      map(collectionListData =>
        collectionListData.map(collectionData => Collection.fromDTO(collectionData))
      ))
  }

  get(id: number): Observable<Collection> {
    const url = `${this.COLLECTION_ENDPOINT}/${id}`;
    return this.http.get<ICollectionDTO>(url).pipe(
      map(collectionData => Collection.fromDTO(collectionData))
    )
  }
}