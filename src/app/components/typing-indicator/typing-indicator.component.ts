import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './typing-indicator.component.html'
})
export class TypingIndicatorComponent {
  mascotteLogo = 'assets/redmine_logo.svg';
  dots = [0, 1, 2];
}
