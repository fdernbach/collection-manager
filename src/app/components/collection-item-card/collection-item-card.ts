import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CollectionItem } from '../../models/collection-item';

@Component({
  imports: [CurrencyPipe],
  selector: 'app-collection-item-card',
  styleUrl: './collection-item-card.scss',
  templateUrl: './collection-item-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionItemCard {

  item: InputSignal<CollectionItem> = input.required<CollectionItem>();

}
