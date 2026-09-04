import { Component, inject, input } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-collection-item-detail',
  styleUrl: './collection-item-detail.scss',
  templateUrl: './collection-item-detail.html',
})
export class CollectionItemDetail {
  
  private readonly activeRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);

  itemId = input<number | null, string | null>(null, {
    alias: 'id', // matches param name 'id'
    transform: value => {
      // Explicit radix 10 avoids '0x...' being parsed as hex; NaN (non-numeric id) falls back to null
      const parsed = value ? parseInt(value, 10) : NaN;
      return Number.isNaN(parsed) ? null : parsed;
    }
  });

}
