import { Component } from '@angular/core';
import { Router,RouterOutlet, NavigationEnd  } from '@angular/router';
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

  ngOnInit() {
    this.token = localStorage.getItem('finish_goods_token')!;
  }

  constructor(private auth: AuthService, private router: Router) {
    this.isLoggedIn$ = this.auth.isLoggedIn$; // get ค่า Token จาก AuthService 

    // ✅ จะทำงานทุกครั้งที่ route/path เปลี่ยน (เหมือน useEffect)
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((event) => {
        console.log('🔄 Navigation changed:', (event as NavigationEnd).urlAfterRedirects);
        this.token = localStorage.getItem('finish_goods_token')!;
      });
  }

}