import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import config from '../../config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authStatus = new BehaviorSubject<boolean>(false);
  authStatus$ = this.authStatus.asObservable();

  // true ถ้ามี token ตั้งแต่เปิดหน้า
  private loggedIn$ = new BehaviorSubject<boolean>(!!localStorage.getItem('finish_goods_token'));
  isLoggedIn$ = this.loggedIn$.asObservable();


  // เพิ่ม BehaviorSubject สำหรับแจ้ง component refresh
  private refreshComponents = new BehaviorSubject<boolean>(false);
  refreshComponents$ = this.refreshComponents.asObservable();

  private authStateChange = new BehaviorSubject<boolean>(false);

  // เพิ่ม Subject สำหรับ auth state
  private authState = new BehaviorSubject<{
    isAuthenticated: boolean;
    token: string | null;
    empNo: string | null;
  }>({
    isAuthenticated: false,
    token: null,
    empNo: null,
  });
  authState$ = this.authState.asObservable();
  
  constructor(private router: Router, private http: HttpClient) {}

  login(userData: any) {
    localStorage.setItem('finish_goods_token', userData.token);
    localStorage.setItem('finish_goods_name', userData.name);
    localStorage.setItem('finish_goods_userId', userData.id);
    localStorage.setItem('finish_goods_empNo', userData.empNo);
    localStorage.setItem('finish_goods_groupId', userData.groupId);
    localStorage.setItem('finish_goods_groupName', userData.groupName);
    localStorage.setItem('finish_goods_sectionId', userData.sectionId); 
    localStorage.setItem('finish_goods_sectionName', userData.sectionName); 
  
    this.authStatus.next(true);
    this.loggedIn$.next(true);
    this.refreshComponents.next(true);
  }

  logout() {
    localStorage.removeItem('finish_goods_token');
    localStorage.removeItem('finish_goods_name');
    localStorage.removeItem('finish_goods_userId');
    localStorage.removeItem('finish_goods_empNo');
    localStorage.removeItem('finish_goods_groupId');
    localStorage.removeItem('finish_goods_groupName');
    localStorage.removeItem('finish_goods_sectionId');
    localStorage.removeItem('finish_goods_sectionName');

    this.authStatus.next(false);
    this.loggedIn$.next(false);
    this.refreshComponents.next(true);
  
    this.router.navigate(['/signIn']);
  }

  getUserLevel() {
    const token = localStorage.getItem('angular_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(config.apiServer + '/api/user/getLevelFromToken', {
      headers,
    });
  }

  updateAuthStatus(status: boolean) {
    this.authStatus.next(status);
  }

  notifyLogin() {
    this.authStateChange.next(true);
  }
}
