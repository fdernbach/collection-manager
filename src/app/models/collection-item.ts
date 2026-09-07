import { ICollectionItemDTO } from "../interfaces/collection-item-dto";

export const Rarities = {
  Legendary: 'Legendary',
  Rare: 'Rare',
  Uncommon: 'Uncommon',
  Common: 'Common',
} as const;
export type Rarity = typeof Rarities[keyof typeof Rarities];

export class CollectionItem {
    id = -1;
    name = "";
    description = "";
    rarity: Rarity = Rarities.Common;
    price = 0;
    image = "";
    collectionId: number = -1;

    copy() {
        return Object.assign(new CollectionItem(), this);
    }
    
    static fromDTO(collectionItemData: ICollectionItemDTO) {
        return Object.assign(new CollectionItem(), collectionItemData);
    }

    toDTO() {
        return {
            name: this.name,
            description: this.description,
            image: this.image,
            rarity: this.rarity,
            price: this.price,
            collectionId: this.collectionId,
        }
    }
}