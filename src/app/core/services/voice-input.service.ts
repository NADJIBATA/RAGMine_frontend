import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VoiceInputService {
  private recognition: any;
  isListening = false;
  transcript$ = new Subject<string>();
  listeningState$ = new Subject<boolean>();

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'fr-FR';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        console.log('event',event)
        this.transcript$.next(transcript);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.listeningState$.next(false);
      };

      this.recognition.onerror = (e: any) => {
        console.error('VoiceInputService | erreur', e.error);
        this.isListening = false;
        this.listeningState$.next(false);
      };
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  start() {
    if (this.recognition && !this.isListening) {
      this.isListening = true;
      this.listeningState$.next(true);
      this.recognition.start();
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  toggle() {
    this.isListening ? this.stop() : this.start();
  }
}
