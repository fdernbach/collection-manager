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

    copy() {
        return Object.assign(new CollectionItem(), this);
    }
    
}