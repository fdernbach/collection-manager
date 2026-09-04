import { Component, effect, inject, input, OnDestroy, Signal, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CollectionItem, Rarities, Rarity } from '../../models/collection-item';
import { CollectionItemCard } from '../../components/collection-item-card/collection-item-card';
import { ConfirmationDialog } from '../../components/confirmation-dialog/confirmation-dialog';
import { CollectionService } from '../../services/collection-service';
import { Collection } from '../../models/collection';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';

@Component({
  imports: [ReactiveFormsModule, CollectionItemCard, ConfirmationDialog, MatButtonModule],
  selector: 'app-collection-item-detail',
  styleUrl: './collection-item-detail.scss',
  templateUrl: './collection-item-detail.html',
})
export class CollectionItemDetail implements OnDestroy {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private collectionService = inject(CollectionService);

  readonly rarities = Object.values(Rarities);
  itemId = input<number | null, string | null>(null, {
    alias: 'id',
    // Explicit radix 10 avoids '0x...' being parsed as hex; NaN (non-numeric id) falls back to null
    transform: (id: string | null) => {
      const parsed = id ? parseInt(id, 10) : NaN;
      return Number.isNaN(parsed) ? null : parsed;
    }
  });
  selectedCollection!: Collection;
  collectionItem = signal<CollectionItem>(new CollectionItem());
  valueChangeSubscription: Subscription | null = null;
  showDeleteConfirmation = signal(false);
  itemFormGroup = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    image: ['', [Validators.required]],
    rarity: [Rarities.Common as Rarity, [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]]
  });

  constructor() {
    // Re-runs whenever itemId() changes (i.e. on every /item/:id navigation), since
    // that's the only signal read in this block.
    effect(() => {
      // Default to a blank item; only overridden below if the route actually carries an id.
      let itemToDisplay = new CollectionItem();
      this.selectedCollection = this.collectionService.getAll()[0];
      if (this.itemId()) {
        const itemFound = this.selectedCollection.items.find(item => item.id === this.itemId());
        if (itemFound) {
          itemToDisplay = itemFound;
        } else {
          // id was given but doesn't match any stored item
          this.router.navigate(['not-found']);
        }
      }
      // Subscribed before patchValue below so its own emitted valueChanges event is
      // caught here too, keeping the live preview (collectionItem) in sync from the
      // very first load, not just from later user edits.
      this.valueChangeSubscription = this.itemFormGroup.valueChanges.subscribe(() => {
        this.collectionItem.set(
          Object.assign(new CollectionItem(), this.itemFormGroup.value)
        );
      });
      // Populates the form (new blank item, or the one found above) and triggers the
      // subscription just set up.
      this.itemFormGroup.patchValue(itemToDisplay);
    });
  }

  ngOnDestroy(): void {
    if (this.valueChangeSubscription) {
      this.valueChangeSubscription.unsubscribe();
    }
  }
  
  save(event: Event) {
    event.preventDefault();
    if (this.itemFormGroup.invalid) {
      return;
    }
    const item = Object.assign(new CollectionItem(), this.itemFormGroup.value);
    const currentId = this.itemId();
    if (currentId) {
      // Editing an existing item: keep its id so updateItem replaces the right entry
      item.id = currentId;
      this.collectionService.updateItem(this.selectedCollection, item);
    } else {
      this.collectionService.addItem(this.selectedCollection, item);
    }
    this.router.navigate(['/home']);
  }

  cancel() {
    this.router.navigate(['/home']);
  }

  confirmDeletion() {
    this.showDeleteConfirmation.set(false);
    const currentId = this.itemId();
    if (currentId) {
      this.collectionService.deleteItem(this.selectedCollection.id, currentId);
      this.router.navigate(['/home']);
    }
  }

  cancelDeletion() {
    this.showDeleteConfirmation.set(false);
  }

  isFieldInvalid(fieldName: string) {
    const formControl = this.itemFormGroup.get(fieldName);
    return formControl?.invalid && (formControl?.dirty || formControl?.touched);
  }

  onFileChange(event: any) {
    const reader = new FileReader();
    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.itemFormGroup.patchValue({
          image: reader.result as string
        });
      };
    }
  }

}
