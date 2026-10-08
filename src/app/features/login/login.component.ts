import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';
import { NgIcon, provideIcons } from '@ng-icons/core';

import {lucideSun, lucideMoon } from '@ng-icons/lucide';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [provideIcons({ lucideSun, lucideMoon})],
  templateUrl: './login.component.html'
})


export class LoginComponent {
  loginVal = '';
  password = '';
  error = '';
  loading = false;
  passwordType: 'password' | 'text' = 'password';
  redmineLogo = '../../../assets/redmine_logo.svg';
  mascotte3 = '../../../assets/redmine_logo.svg';
  mascotteBonjour = '../../../assets/redmine_logo.svg';
  eye = "../../../assets/eye.svg"
  hide ="../../../assets/hide.svg"

  constructor(private api: ApiService, private router: Router,  public theme: ThemeService) {}

  togglePasswordType() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }
  toggleTheme() {
    this.theme.toggle();
  }

  async handleSubmit() {
    if (!this.loginVal || !this.password) return;

    this.loading = true;
    this.error = '';

    try {
      const data = await this.api.login(this.loginVal.trim(), this.password);

      sessionStorage.setItem('ragmine_token', data.token);
      sessionStorage.setItem('ragmine_login', data.login);
      sessionStorage.setItem('ragmine_firstname', data.firstname);
      sessionStorage.setItem('ragmine_lastname', data.lastname);
      sessionStorage.setItem('ragmine_mail', data.mail);

      this.router.navigate(['/chat']);
    } catch (err: any) {
      this.error = err.message || 'Login ou mot de passe incorrect';
    } finally {
      this.loading = false;
    }
  }
}
