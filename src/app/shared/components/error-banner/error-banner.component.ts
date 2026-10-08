import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-banner" *ngIf="message">
      {{ message }}
    </div>
  `,
  styles: [`
    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #E60012;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 14px;
      margin-bottom: 20px;
    }
  `],
})
export class ErrorBannerComponent {
  @Input() message = '';
}
