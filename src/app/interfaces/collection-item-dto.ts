import { Rarity } from "../models/collection-item";

export interface ICollectionItemDTO {
    id?: number;
    name: string;
    description: string;
    image: string;
    rarity: Rarity;
    price: number;
    collectionId: number;
}
