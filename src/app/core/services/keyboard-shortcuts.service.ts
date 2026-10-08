import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class KeyboardShortcutsService {
  newConversation$ = new Subject<void>();
  focusInput$ = new Subject<void>();
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K → Nouvelle conversation
      if (cmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.newConversation$.next();
      }

      // Cmd/Ctrl + / → Focus sur l'input
      if (cmdOrCtrl && e.key === '/') {
        e.preventDefault();
        this.focusInput$.next();
      }
    });
  }
}
