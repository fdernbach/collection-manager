import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { CollectionItem } from '../../models/collection-item';
import { ICollectionItemDTO } from '../../interfaces/collection-item-dto';

@Service()
export class CollectionItemService {

    private baseURL = 'http://localhost:3000';
    private itemsEndpoint = this.baseURL + '/items';
    private http = inject(HttpClient);

    // Fetches every item across all collections, flat (not scoped to a single
    // collection — CollectionService.get() already returns each collection's own
    // items nested). Not currently called anywhere in the app; kept for a future
    // cross-collection item listing/search feature.
    getAll(): Observable<CollectionItem[]> {
        return this.http.get<ICollectionItemDTO[]>(this.itemsEndpoint).pipe(
            map(itemJsonArray => {
                return itemJsonArray.map(
                    itemJson => CollectionItem.fromDTO(itemJson)
                );
            })
        );
    }

    // Used by CollectionItemDetail's collectionItem$ to (re)load the item being
    // viewed/edited whenever the route's :id param changes.
    get(itemId: number): Observable<CollectionItem> {
        const url = `${this.itemsEndpoint}/${itemId}`;
        return this.http.get<ICollectionItemDTO>(url).pipe(
            map(itemJson => CollectionItem.fromDTO(itemJson))
        );
    }

    // Called from CollectionItemDetail.save() when the item has no id (new-item
    // mode). Typed Observable<void>: the server presumably assigns and returns the
    // new item's id, but the response body is discarded here — callers never learn
    // it, they just navigate away on success.
    add(item: CollectionItem): Observable<void> {
        return this.http.post<void>(this.itemsEndpoint, item.toDTO());
    }

    // Called from CollectionItemDetail.save() when the item already has an id
    // (edit mode). Relies on item.id being correct/current — see formValueChanges$
    // in that component, which is what keeps it stamped onto the item as the user types.
    update(item: CollectionItem): Observable<void> {
        const url = `${this.itemsEndpoint}/${item.id}`
        return this.http.put<void>(url, item.toDTO());
    }

    // Called from CollectionItemDetail.deleteItem(), itself only reachable after the
    // user accepts the delete confirmation dialog (confirmDeletion()).
    delete(item: CollectionItem): Observable<void> {
        const url = `${this.itemsEndpoint}/${item.id}`
        return this.http.delete<void>(url);
    }

}
