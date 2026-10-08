import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import MD5 from 'crypto-js/md5';
import { MarkdownPipe } from '../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, MarkdownPipe],
  templateUrl: './message.component.html'
})
export class MessageComponent {
  @Input() role: 'user' | 'assistant' = 'user';
  @Input() content = '';
  @Input() toolCalls: any[] = [];
  @Input() login = '';
  @Input() firstname = '';


  get isUser(): boolean {
    return this.role === 'user';
  }

  get avatarUrl(): string {
    const fName = sessionStorage.getItem('ragmine_firstname') || '';
    const lName = sessionStorage.getItem('ragmine_lastname') || '';
    const id = MD5(`${fName} ${lName}`.trim().toLowerCase()).toString();
    return `https://www.gravatar.com/avatar/${id}?rating=PG&size=50&default=monsterid`;
  }
}
