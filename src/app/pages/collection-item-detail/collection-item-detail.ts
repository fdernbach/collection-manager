import { Component, inject, input, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CollectionItem, Rarities, Rarity } from '../../models/collection-item';
import { CollectionItemCard } from '../../components/collection-item-card/collection-item-card';
import { ConfirmationDialog } from '../../components/confirmation-dialog/confirmation-dialog';
import { CollectionService } from '../../services/collection/collection-service';
import { CollectionItemService } from '../../services/collection-item/collection-item-service';
import { catchError, EMPTY, filter, switchMap, tap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  imports: [ReactiveFormsModule, CollectionItemCard, ConfirmationDialog, 
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  selector: 'app-collection-item-detail',
  styleUrl: './collection-item-detail.scss',
  templateUrl: './collection-item-detail.html',
})
export class CollectionItemDetail {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private collectionService = inject(CollectionService);
  private collectionItemService = inject(CollectionItemService);

  readonly rarities = Object.values(Rarities);
  itemId = input<number | null, string | null>(null, {
    alias: 'id',
    // Explicit radix 10 avoids '0x...' being parsed as hex; NaN (non-numeric id) falls back to null
    transform: (id: string | null) => {
      const parsed = id ? parseInt(id, 10) : NaN;
      return Number.isNaN(parsed) ? null : parsed;
    }
  });
  selectedCollection = linkedSignal(() =>
    this.collectionService.selectedCollection());
  
  collectionItem = signal<CollectionItem>(new CollectionItem());
  collectionItem$ = toObservable(this.itemId).pipe(
    takeUntilDestroyed(),
    filter(itemId => itemId !== null),
    switchMap(itemId => this.collectionItemService.get(itemId)),
    tap(item => {
      this.collectionItem.set(item);
      this.itemFormGroup.patchValue(item);
    }),
  );

  itemCollection$ = this.collectionItem$.pipe(
    takeUntilDestroyed(),
    switchMap(item => this.collectionService.get(item.collectionId)),
    catchError(error => {
      this.navigateBack();
      return EMPTY;
    }),
    tap(collection => {
      this.selectedCollection.set(collection);
    })
  );
  
  showDeleteConfirmation = signal(false);
  itemFormGroup = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    image: ['', [Validators.required]],
    rarity: [Rarities.Common as Rarity, [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]]
  });

  formValueChanges$ = this.itemFormGroup.valueChanges.pipe(
    takeUntilDestroyed(),
    tap(_ => {
      this.collectionItem.set(Object.assign(new CollectionItem(), {
        ...this.itemFormGroup.value,
        id: this.itemId(),
        collectionId: this.selectedCollection()?.id
      }));
    })
  );
  
  constructor() {
    this.collectionItem$.subscribe();
    this.formValueChanges$.subscribe();
  }

  save(event: Event) {
    event.preventDefault();

    const item = this.collectionItem();
    if (!item) return;

    let saveObservable = null;
    if (item.id) {
      saveObservable = this.collectionItemService.update(item);
    } else {
      saveObservable = this.collectionItemService.add(item);
    }
    saveObservable.subscribe(() => {
      this.navigateBack();
    });
  }

  navigateBack() {
    this.router.navigate(['/']);
  }

  deleteItem() {
    const item = this.collectionItem();
    if (item) {
      this.collectionItemService.delete(item).subscribe(() => {
        this.navigateBack();
      });
    }
  }

  confirmDeletion() {
    this.showDeleteConfirmation.set(false);
    this.deleteItem();
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
