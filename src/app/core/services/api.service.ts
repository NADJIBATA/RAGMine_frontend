import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface LoginResponse {
  token: string;
  login: string;
  firstname: string;
  lastname: string;
  mail: string;
}

export interface HistoryMessage {
  role: string;
  content: string;
  tool_calls?: any[];
  toolCalls?: any[];
}

export interface SendMessageResponse {
  success: boolean;
  response?: string;
  tool_calls?: any[];
  error?: string;
  cancelled?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly BASE_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Helpers ─────────────────────────────────
  private getToken(): string | null {
    return sessionStorage.getItem('ragmine_token');
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getToken()}`
    });
  }

  // ── AUTH ────────────────────────────────────
  async login(loginStr: string, password: string): Promise<LoginResponse> {
    try {
      return await firstValueFrom(
        this.http.post<LoginResponse>(`${this.BASE_URL}/auth`, {
          login: loginStr,
          password
        })
      );
    } catch (err: any) {
      const detail = err?.error?.detail || "Erreur d'authentification";
      throw new Error(detail);
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.BASE_URL}/logout`, null, {
          headers: this.authHeaders()
        })
      );
    } catch {
      // on ignore l'erreur, on nettoie quand même
    } finally {
      sessionStorage.removeItem('ragmine_token');
      sessionStorage.removeItem('ragmine_login');
      sessionStorage.removeItem('ragmine_firstname');
      sessionStorage.removeItem('ragmine_lastname');
      sessionStorage.removeItem('ragmine_mail');
    }
  }

  // ── CHAT ────────────────────────────────────
  async sendMessage(
    message: string,
    reasoningEffort: string = 'none',
    intent: string = 'auto'
  ): Promise<SendMessageResponse | undefined> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180_000);

    try {
      const response = await fetch(`${this.BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({
          message,
          reasoning_effort: reasoningEffort,
          intent
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        await this.logout();
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        let errorDetail = 'Erreur serveur';
        try {
          const body = await response.json();
          errorDetail = body.detail || body.error || body.message || JSON.stringify(body);
        } catch {
          errorDetail = await response.text();
        }
        console.error(`sendMessage | HTTP ${response.status} | ${errorDetail}`);
        throw new Error(`HTTP ${response.status} : ${errorDetail}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }

      console.error('sendMessage | erreur | ', error);
      throw error;
    }
  }

  // ── HISTORIQUE ──────────────────────────────
  async clearHistory(): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.BASE_URL}/history`, { headers: this.authHeaders() })
    );
  }

  async getHistory(): Promise<{ success: boolean; history: HistoryMessage[] }> {
    return await firstValueFrom(
      this.http.get<{ success: boolean; history: HistoryMessage[] }>(
        `${this.BASE_URL}/history`,
        { headers: this.authHeaders() }
      )
    );
  }

  // ── CANCEL ──────────────────────────────────
  async cancelMessage(): Promise<{ success: boolean; cancelled: boolean }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(`${this.BASE_URL}/chat/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`cancelMessage | HTTP ${response.status} | ignoré`);
        return { success: false, cancelled: false };
      }

      return await response.json();
    } catch {
      clearTimeout(timeoutId);
      return { success: false, cancelled: false };
    }
  }
}
