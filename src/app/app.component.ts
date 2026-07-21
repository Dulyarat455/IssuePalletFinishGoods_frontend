import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    SidebarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  token: string | undefined = '';
  isLoggedIn$!: Observable<boolean>;

  constructor(private auth: AuthService, private router: Router) {
    this.isLoggedIn$ = this.auth.isLoggedIn$;

    this.auth.isLoggedIn$.subscribe((isLoggedIn) => {
      this.token = isLoggedIn
        ? localStorage.getItem('finish_goods_token') || ''
        : '';
    });

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((event) => {
        console.log('Navigation changed:', (event as NavigationEnd).urlAfterRedirects);
        this.token = localStorage.getItem('finish_goods_token') || '';
      });
  }

  ngOnInit() {
    this.token = localStorage.getItem('finish_goods_token') || '';
  }
}