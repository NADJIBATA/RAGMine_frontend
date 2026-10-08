import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'ragmine_token';

  isAuthenticated = signal<boolean>(this.hasToken());

  constructor(private http: HttpClient) {}

  login(login: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { login, password })
      .pipe(
        tap((data) => {
          sessionStorage.setItem('ragmine_token', data.token);
          sessionStorage.setItem('ragmine_login', data.login);
          sessionStorage.setItem('ragmine_firstname', data.firstname);
          sessionStorage.setItem('ragmine_lastname', data.lastname);
          sessionStorage.setItem('ragmine_mail', data.mail);
          this.isAuthenticated.set(true);
        })
      );
  }

  logout(): void {
    sessionStorage.clear();
    this.isAuthenticated.set(false);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  getUser() {
    return {
      login: sessionStorage.getItem('ragmine_login'),
      firstname: sessionStorage.getItem('ragmine_firstname'),
      lastname: sessionStorage.getItem('ragmine_lastname'),
      mail: sessionStorage.getItem('ragmine_mail'),
    };
  }

  private hasToken(): boolean {
    return !!sessionStorage.getItem(this.tokenKey);
  }
}
