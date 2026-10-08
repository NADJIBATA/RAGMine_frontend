import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewChecked, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import MD5 from 'crypto-js/md5';

import { ApiService } from '../../core/services/api.service';
import { VoiceInputService } from '../../core/services/voice-input.service';
import { ThemeService } from '../../core/services/theme.service';
import { KeyboardShortcutsService } from '../../core/services/keyboard-shortcuts.service';
import { MessageComponent } from '../../components/message/message.component';
import { TypingIndicatorComponent } from '../../components/typing-indicator/typing-indicator.component';
import { SuggestionsComponent } from '../../components/suggestions/suggestions.component';
import { ReasoningSelectorComponent } from '../../components/reasoning-selector/reasoning-selector.component';
import { IntentSelectorComponent } from '../../components/intent-selector/intent-selector.component';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCirclePlus, lucideMic, lucideMicOff, lucideSun, lucideMoon } from '@ng-icons/lucide';
import { octSignOut } from '@ng-icons/octicons';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: any[];
}

const MESSAGES_KEY = 'ragmine_messages';
const REASONING_KEY = 'ragmine_reasoning';
const INTENT_KEY = 'ragmine_intent';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    MessageComponent,
    TypingIndicatorComponent,
    SuggestionsComponent,
    ReasoningSelectorComponent,
    IntentSelectorComponent,
  ],
  providers: [
    provideIcons({ lucideCirclePlus, octSignOut, lucideMic, lucideMicOff, lucideSun, lucideMoon })
  ],
  templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('bottomRef') bottomRef!: ElementRef;
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLTextAreaElement>;

  login = sessionStorage.getItem('ragmine_login') || '';
  firstname = sessionStorage.getItem('ragmine_firstname') || '';
  lastname = sessionStorage.getItem('ragmine_lastname') || '';

  messages: ChatMessage[] = [];
  historyLoaded = false;
  input = '';
  clearingHistory = false;
  loading = false;
  cancelling = false;

  intent = sessionStorage.getItem(INTENT_KEY) || 'auto';
  reasoning = sessionStorage.getItem(REASONING_KEY) || 'none';

  redmineLogo = '../../../assets/redmine_logo.svg';
  mascotte3 = '../../../assets/redmine_logo.svg';

  // 🎤 Voice input
  isListening = false;
  voiceSupported = false;

  get gravatarId(): string {
    return MD5(`${this.firstname} ${this.lastname}`.trim().toLowerCase()).toString();
  }

  private shouldScroll = false;
  private subs: Subscription[] = [];

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public theme: ThemeService,
    private voiceService: VoiceInputService,
    private shortcuts: KeyboardShortcutsService
  ) {}

  isCompactHeader = false;
  isMobile = false ;


  @HostListener('window:resize')
  checkScreen() {
    this.isMobile = window.innerWidth < 800;
  }


  async ngOnInit() {
    const msgs = await this.loadMessages();
    this.messages = msgs;
    this.historyLoaded = true;
    this.shouldScroll = true;
    this.checkScreen();
    this.cdr.detectChanges();



    // 🎤 Voice input setup
    this.voiceSupported = this.voiceService.isSupported();
    console.log(this.voiceSupported)
    this.subs.push(
      this.voiceService.transcript$.subscribe(text => {
        this.input = text;
        this.cdr.detectChanges();
      }),
      this.voiceService.listeningState$.subscribe(state => {
        this.isListening = state;
        this.cdr.detectChanges();
      })
    );

    // ⌨️ Keyboard shortcuts
    this.shortcuts.init();
    this.subs.push(
      this.shortcuts.newConversation$.subscribe(() => {
        if (!this.loading) this.handleNewConversation();
      }),
      this.shortcuts.focusInput$.subscribe(() => {
        this.inputRef?.nativeElement?.focus();
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.bottomRef?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  toggleVoiceInput() {
    this.voiceService.toggle();
  }

  toggleTheme() {
    this.theme.toggle();
  }





  private saveMessages(msgs: ChatMessage[]) {
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
  }

  private clearMessagesStorage() {
    sessionStorage.removeItem(MESSAGES_KEY);
  }

  private async loadMessages(): Promise<ChatMessage[]> {
    try {
      const data = await this.api.getHistory();
      if (!data.success || !Array.isArray(data.history)) return [];

      return data.history
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .filter(msg => {
          const content = msg.content?.trim() || '';
          if (/^\[tool_call:.*\]$/i.test(content)) return false;
          if (msg.role === 'user') {
            if (content.startsWith('Références Redmine disponibles')) return false;
            if (content.startsWith("Résultat de l'outil")) return false;
          }
          return true;
        })
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          toolCalls: msg.tool_calls || msg.toolCalls || []
        }));
    } catch (error) {
      console.error('loadMessages | erreur', error);
      return [];
    }
  }

  async handleSend(text?: string) {
    const message = (text || this.input).trim();
    if (!message || this.loading) return;

    if (this.isListening) this.voiceService.stop();

    this.input = '';
    this.messages = [...this.messages, { role: 'user', content: message }];
    this.loading = true;
    this.cancelling = false;
    this.shouldScroll = true;
    this.cdr.detectChanges();

    try {
      const data = await this.api.sendMessage(message, this.reasoning, this.intent);
      if (!data) return;

      if (!data.success && data.cancelled) {
        this.messages = [...this.messages, { role: 'assistant', content: '⛔ Requête annulée.' }];
        return;
      }

      if (!data.success) {
        this.messages = [...this.messages, {
          role: 'assistant',
          content: `❌ Erreur : ${data.error || 'Erreur inconnue'}`
        }];
        return;
      }

      this.messages = [...this.messages, {
        role: 'assistant',
        content: data.response || '',
        toolCalls: data.tool_calls || []
      }];
    } catch (error: any) {
      console.error('handleSend | erreur | ', error);
      const isTimeout = error.message?.includes('TIMEOUT') || error.name === 'AbortError';
      this.messages = [...this.messages, {
        role: 'assistant',
        content: isTimeout
          ? '⏱️ La réponse prend trop de temps (> 3 min). Réessayez.'
          : `❌ Erreur réseau : ${error.message || 'inconnue'}`
      }];
    } finally {
      this.loading = false;
      this.cancelling = false;
      this.shouldScroll = true;
      if (this.historyLoaded) this.saveMessages(this.messages);
      this.cdr.detectChanges();
      setTimeout(() => this.inputRef?.nativeElement?.focus(), 0);
    }
  }

  async handleNewConversation() {
    if (!confirm("Démarrer une nouvelle conversation ? L'historique sera effacé.")) return;
    this.cdr.detectChanges();
    try {
      await this.api.clearHistory();
      this.loading = false;
      this.messages = [];
      this.clearMessagesStorage();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('handleNewConversation | erreur', error);
      this.messages = [{ role: 'assistant', content: 'Erreur lors de la réinitialisation.' }];
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
      setTimeout(() => this.inputRef?.nativeElement?.focus(), 0);
    }
  }

  async handleLogout() {
    this.clearMessagesStorage();
    await this.api.logout();
    this.router.navigate(['/login']);
  }

  handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  }

  async handleCancel() {
    if (!this.loading || this.cancelling) return;
    this.cancelling = true;
    try {
      await this.api.cancelMessage();
    } catch (error) {
      console.error('handleCancel | erreur', error);
    } finally {
      this.cancelling = false;
    }
  }

  handleReasoningChange(value: string) {
    this.reasoning = value;
    sessionStorage.setItem(REASONING_KEY, value);
  }

  handleIntentChange(value: string) {
    this.intent = value;
    sessionStorage.setItem(INTENT_KEY, value);
  }

  autoResize(e: Event) {
    const el = e.target as HTMLTextAreaElement;
    el.style.height = '180px';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

}
