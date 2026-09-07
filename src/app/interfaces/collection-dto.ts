import { ICollectionItemDTO } from "./collection-item-dto";

export interface ICollectionDTO {
    id?: number;
    title: string;
    items?: ICollectionItemDTO[];
    itemsCount?: number;
}
