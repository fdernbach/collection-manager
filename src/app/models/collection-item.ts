export class CollectionItem {
    id = -1;
    name = "Linx";
    description = "A legendary sword of unmatched sharpness and history.";
    rarity = "Legendary";
    price = 199;
    image = "img/linx2.png"

    copy() {
        return Object.assign(new CollectionItem(), this);
    }
    
}