import { ICollectionDTO } from "../interfaces/collection-dto";
import { CollectionItem } from "./collection-item";

export class Collection {
    id = -1;
    title = "My Collection";
    items: CollectionItem[] = [];
    itemsCount: number = 0;

    copy() {
        const copiedCollection = Object.assign(new Collection(), this);
        copiedCollection.items = this.items.map(item => item.copy());
        return copiedCollection;
    }

    static fromDTO(collectionData: ICollectionDTO) {
        return Object.assign(new Collection(), {
            ...collectionData,
            items: collectionData.items?.map(
                item => CollectionItem.fromDTO(item))
        });
    }
    toDTO(): ICollectionDTO {
        return {
            title: this.title
        };
    }
    
}