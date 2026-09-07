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
  // Bound to the router's :id path param via component input binding (alias 'id'),
  // not set imperatively — see app.routes.ts, where this component is mounted at
  // both /item (no id: "new item" mode) and /item/:id (edit mode). Because this is
  // a signal input, navigating from /item/1 straight to /item/2 updates itemId()
  // in place on the same component instance rather than destroying/recreating it,
  // which is exactly what collectionItem$ below relies on to refetch the new item.
  // null means "new item" throughout this component (template, collectionItem$'s
  // filter, formValueChanges$'s reconstructed CollectionItem).
  itemId = input<number | null, string | null>(null, {
    alias: 'id',
    // Explicit radix 10 avoids '0x...' being parsed as hex; NaN (non-numeric id) falls back to null
    transform: (id: string | null) => {
      const parsed = id ? parseInt(id, 10) : NaN;
      return Number.isNaN(parsed) ? null : parsed;
    }
  });
  // Which collection this item belongs to (edit mode) or will be added to (new-item
  // mode). linkedSignal seeds itself from CollectionService's app-wide
  // selectedCollection — the one MainMenu sets when the user picks a collection —
  // so navigating here without changing collections stays consistent with it, but
  // stays locally writable so itemCollection$'s tap can update it per the item
  // actually loaded (relevant once that pipeline is subscribed — see its NOTE above).
  // Read by formValueChanges$ to stamp collectionId onto the reconstructed item.
  selectedCollection = linkedSignal(() =>
    this.collectionService.selectedCollection());

  // The item currently shown/edited: a blank CollectionItem() by default (new-item
  // mode), overwritten once collectionItem$ resolves an existing item (edit mode),
  // and kept live-updated from unsaved form edits by formValueChanges$ below. This
  // is the single source of truth save()/deleteItem() act on, and what the
  // <app-collection-item-card> preview in the template renders.
  collectionItem = signal<CollectionItem>(new CollectionItem());
  
  // toObservable turns the itemId input signal into a stream so route-driven changes
  // (a fresh /item/:id navigation while this component instance stays alive) can go
  // through switchMap: any in-flight get() for a stale itemId is cancelled the moment
  // a newer one arrives, instead of racing and possibly resolving out of order.
  // null itemId (no route param, i.e. "new item" mode) is filtered out entirely, so
  // switchMap/tap only ever run with a real, loaded item — the blank CollectionItem()
  // above stays as the default for that case.
  // takeUntilDestroyed() self-unsubscribes on component destroy; no manual
  // Subscription bookkeeping needed like the old valueChangeSubscription approach.
  collectionItem$ = toObservable(this.itemId).pipe(
    takeUntilDestroyed(),
    filter(itemId => itemId !== null),
    switchMap(itemId => this.collectionItemService.get(itemId)),
    tap(item => {
      this.collectionItem.set(item);
      this.itemFormGroup.patchValue(item);
    }),
  );

  // Piped off collectionItem$ (not itemId directly) so it re-fires with each newly
  // loaded item's collectionId, keeping selectedCollection in sync with whichever
  // item is currently shown. catchError swallows a failed lookup (e.g. a stale/
  // deleted collectionId) by navigating away and returning EMPTY, so the error
  // doesn't propagate and silently kill the subscription for good.
  // NOTE: like collectionItem$ and formValueChanges$, this is just a definition —
  // an RxJS Observable does nothing until something calls .subscribe() on it. Unlike
  // the other two, nothing subscribes to itemCollection$ (see constructor), so this
  // pipeline currently never runs.
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
  
  // Drives the <app-confirmation-dialog> in the template: the Delete button (only
  // rendered in edit mode, see itemId() above) sets this true instead of deleting
  // directly, so the user must confirm — confirmDeletion() flips it back to false
  // and proceeds with deleteItem(); cancelDeletion() just flips it back off.
  showDeleteConfirmation = signal(false);
  itemFormGroup = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    image: ['', [Validators.required]],
    rarity: [Rarities.Common as Rarity, [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]]
  });

  // Mirrors live form edits back into the collectionItem signal (rather than only
  // updating it on submit), so anything reading collectionItem() — e.g. the
  // <app-collection-item-card> preview in the template — reflects each keystroke.
  // itemId()/selectedCollection() are read here because the form itself has no
  // controls for id/collectionId; they'd otherwise be lost from itemFormGroup.value.
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
    // Each $-suffixed field above is a cold Observable definition, inert until
    // subscribed. Subscribing here (once, for the component's lifetime) is what
    // actually starts each pipeline; takeUntilDestroyed() then tears it down
    // automatically when the component is destroyed.
    this.collectionItem$.subscribe();
    this.formValueChanges$.subscribe();
  }

  // Called on form submit (the Save button, disabled while itemFormGroup is invalid).
  // Reads collectionItem() rather than rebuilding from the form directly, since
  // formValueChanges$ already keeps it live-updated and stamped with id/collectionId.
  // add vs. update is decided purely by whether an id is present — null in new-item
  // mode (see itemId() above), a real value in edit mode — never by itemFormGroup
  // being touched/dirty.
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

  // Shared "leave this page" step: called after a successful save/delete, from the
  // template's Cancel button, and from itemCollection$'s catchError when the item's
  // collection can't be loaded.
  navigateBack() {
    this.router.navigate(['/']);
  }

  // Performs the actual delete call; only invoked from confirmDeletion() below, once
  // the user has accepted the confirmation dialog — never called directly from the
  // template, so there's no separate "are you sure" check needed here.
  deleteItem() {
    const item = this.collectionItem();
    if (item) {
      this.collectionItemService.delete(item).subscribe(() => {
        this.navigateBack();
      });
    }
  }

  // (confirmed) handler for <app-confirmation-dialog>, shown when showDeleteConfirmation()
  // is true. Hides the dialog first, then deletes — so the dialog closes immediately
  // rather than waiting on the delete request.
  confirmDeletion() {
    this.showDeleteConfirmation.set(false);
    this.deleteItem();
  }

  // (cancelled) handler for <app-confirmation-dialog>: just dismisses it, item is untouched.
  cancelDeletion() {
    this.showDeleteConfirmation.set(false);
  }

  // Called from the template for each form field (name/description/image/price) to
  // decide whether to render its <mat-error>. Requires dirty or touched in addition
  // to invalid so errors don't show before the user has interacted with the field —
  // e.g. right when the "new item" blank form first renders.
  isFieldInvalid(fieldName: string) {
    const formControl = this.itemFormGroup.get(fieldName);
    return formControl?.invalid && (formControl?.dirty || formControl?.touched);
  }

  // (change) handler for the hidden native file input behind the "Upload Image"
  // button. Reactive forms can't bind a file input's value directly, so this reads
  // the chosen file as a data URL and patches the "image" control manually instead.
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
