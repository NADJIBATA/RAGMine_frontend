import { Component, EventEmitter, Input, Output, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ReasoningMode {
  value: string;
  label: string;
  icon: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-reasoning-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reasoning-selector.component.html'
})
export class ReasoningSelectorComponent implements OnInit {
  @Input() value = 'none';
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<string>();

  isSmallScreen = false;

  halfhour = "../../../assets/half-an-hour.svg";
  quartterhour = "../../../assets/quarter-of-an-hour.svg";
  th3quartterhour = "../../../assets/three-quarters-of-an-hour.svg";
  sevenmin = "../../../assets/sevenmin.svg";

  modes: ReasoningMode[] = [
    {
      value: "none",
      label: "Aucun",
      icon: this.sevenmin,
      description: "Aucun raisonnement. Adapté aux questions simples avec un temps de réponse très rapide.",
      color: "text-gray-800",
    },
    {
      value: "low",
      label: "Faible",
      icon: this.quartterhour,
      description: "Raisonnement limité. Adapté aux questions peu complexes avec un temps de réponse rapide.",
      color: "text-gray-800",
    },
    {
      value: "medium",
      label: "Moyen",
      icon: this.halfhour,
      description: "Raisonnement modéré. Adapté aux questions plus complexes avec un temps de réponse intermédiaire.",
      color: "text-gray-800",
    },
    {
      value: "high",
      label: "Élevé",
      icon: this.th3quartterhour,
      description: "Raisonnement approfondi. Adapté aux questions complexes avec un temps de réponse plus long.",
      color: "text-gray-800",
    },
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

  get selectedMode(): ReasoningMode | undefined {
    return this.modes.find(m => m.value === this.value);
  }
}
