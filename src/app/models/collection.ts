import { CollectionItem } from "./collection-item";

export class Collection {
    id = -1;
    title = "My Collection";
    items: CollectionItem[] = [];

    copy() {
        const copiedCollection = Object.assign(new Collection(), this);
        copiedCollection.items = this.items.map(item => item.copy());
        return copiedCollection;
    }
}