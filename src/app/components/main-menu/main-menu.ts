import { Component, effect, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login/login-service';
import { CollectionService } from '../../services/collection/collection-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';

@Component({
  imports: [MatButton],
  selector: 'app-main-menu',
  styleUrl: './main-menu.scss',
  templateUrl: './main-menu.html',
})
export class MainMenu {

  private readonly LK_SELECTED_COLLECTION = "selectedCollection";

  private loginService = inject(LoginService);
  private router = inject(Router);
  private collectionService = inject(CollectionService);

  readonly collections=toSignal(this.collectionService.getAll(), {initialValue: []});
  readonly selectedCollection = this.collectionService.selectedCollection;

  // Re-exposing the service's own signal: app.html reads it as `user()` and
  // reacts whenever LoginService updates it. Nothing in this component
  // populates it on startup — isLoggedInGuard already fetches it (with proper
  // error handling) the moment any guarded route is activated, which covers
  // every case that matters (including a fresh page reload, since the guard
  // re-runs on the initial navigation too). A second, independent fetch here
  // used to race that one and had no error handling of its own — see git
  // history / code review notes if you're wondering why it's gone.
  protected user = this.loginService.user;

  constructor() {
    effect(() => {
      this.loadSelectedCollection();
    });
  }
  
  logout() {
    this.loginService.logout().subscribe({
      next: () => this.router.navigate(['login']),
      error: () => this.router.navigate(['login'])
    });
  }

  select(selectedCollectionId: number) {
    if (selectedCollectionId) {
      localStorage.setItem(this.LK_SELECTED_COLLECTION, String(selectedCollectionId));
      this.collectionService.get(selectedCollectionId).subscribe(collection => {
        this.selectedCollection.set(collection);
        this.router.navigate(['collection', collection.id]);
      });
    }
  }

  loadSelectedCollection() {
    const storedCollection = localStorage.getItem(this.LK_SELECTED_COLLECTION);
    let identifiedCollection = null;
    if (storedCollection) {
      identifiedCollection = this.collections().find(c => c.id === parseInt(storedCollection));
    }
    if (!identifiedCollection) {
      identifiedCollection = this.collections()[0];
    }
    if (identifiedCollection.id) {
      this.collectionService.get(identifiedCollection.id).subscribe(collection => {
        this.selectedCollection.set(collection);
        if (this.router.url === '/collection') {
          this.router.navigate(['collection', collection.id]);
        }
      });
    }
  }

}

