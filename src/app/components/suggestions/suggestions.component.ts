import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Suggestion {
  icon: string;
  text: string;
}

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suggestions.component.html'
})
export class SuggestionsComponent {
  @Output() select = new EventEmitter<string>();

  mascotteBonjour = '../../../assets/redmine_logo.svg';
  firstname = sessionStorage.getItem('ragmine_firstname') || '';
  suggestions: Suggestion[] = [];

  onSelect(text: string) {
    this.select.emit(text);
  }
}
