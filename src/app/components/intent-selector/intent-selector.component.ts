import { Component, EventEmitter, Input, Output, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface IntentMode {
  value: string;
  label: string;
  icon: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-intent-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './intent-selector.component.html'
})
export class IntentSelectorComponent implements OnInit {
  @Input() value = 'auto';
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<string>();

  isSmallScreen = false;

  modes: IntentMode[] = [
    { value: "auto", label: "Auto", icon: "⚡", description: "Détection automatique du mode le plus adapté.", color: "text-purple-500" },
    { value: "rag_only", label: "RAG", icon: "📚", description: "Recherche documentaire uniquement.", color: "text-green-500" },
    { value: "mcp_only", label: "MCP", icon: "🔧", description: "Accès aux données Redmine en temps réel.", color: "text-blue-500" },
    { value: "chitchat", label: "Chat", icon: "💬", description: "Conversation générale sans utiliser les données Redmine.", color: "text-yellow-500" }
  ];

  ngOnInit() {
    this.checkScreen();
  }

  @HostListener('window:resize')
  checkScreen() {
    this.isSmallScreen = window.innerWidth < 1500;
  }

  select(v: string) {
    if (this.disabled) return;
    this.valueChange.emit(v);
  }

  onSelectChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.select(val);
  }

  get selectedMode(): IntentMode | undefined {
    return this.modes.find(m => m.value === this.value);
  }
}
