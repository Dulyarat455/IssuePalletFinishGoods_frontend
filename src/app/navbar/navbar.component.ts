import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  formattedDate: string = '';
  formattedTime: string = '';
  private timeInterval: any;
  private routerSub?: Subscription;
  private authSub?: Subscription;

  token: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.refreshToken();

    this.updateDateTime();

    this.timeInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);

    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.refreshToken();
      });

    this.authSub = this.authService.authStatus$.subscribe(() => {
      this.refreshToken();
    });
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }

    this.routerSub?.unsubscribe();
    this.authSub?.unsubscribe();
  }

  refreshToken() {
    this.token = localStorage.getItem('finish_goods_token') || '';
  }

  isLoggedIn(): boolean {
    return this.token.trim().length > 0;
  }

  private updateDateTime() {
    const now = new Date();
    this.formattedDate = this.formatDate(now);
    this.formattedTime = this.formatTime(now);
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
}