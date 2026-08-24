import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';

import Swal from 'sweetalert2';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {

  name: string = '';
  empNo: string = '';
  groupName: string = '';
  sectionName: string = '';
  role: string = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  /* =====================================================
     LOAD USER
  ===================================================== */

  loadUserData(): void {
    this.name =
      localStorage.getItem('finish_goods_name') || '';

    this.empNo =
      localStorage.getItem('finish_goods_empNo') || '';

    this.groupName =
      localStorage.getItem('finish_goods_groupName') || '';

    this.sectionName =
      localStorage.getItem('finish_goods_sectionName') || '';

    this.role =
      localStorage.getItem('finish_goods_role') || '';

    if (!this.name) {
      this.router.navigate(['/']).then(() => {
        Swal.fire({
          title: 'กรุณาเข้าสู่ระบบ',
          text: 'คุณยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อนดำเนินการ',
          icon: 'warning',
          confirmButtonText: 'ตกลง',
        });
      });

      return;
    }
  }

  /* =====================================================
     ROLE DISPLAY
  ===================================================== */

  getRoleDisplay(): string {
    if (!this.role) {
      return '-';
    }

    return this.role;
  }

  /* =====================================================
     GROUP DISPLAY
  ===================================================== */

  getGroupDisplay(): string {
    return this.groupName || '-';
  }

  /* =====================================================
     SECTION DISPLAY
  ===================================================== */

  getSectionDisplay(): string {
    return this.sectionName || '-';
  }

  /* =====================================================
     SIGN OUT
  ===================================================== */

  async signout(): Promise<void> {
    const button = await Swal.fire({
      title: 'ออกจากระบบ',
      text: 'คุณต้องการออกจากระบบ ใช่หรือไม่',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    });

    if (button.isConfirmed) {
      this.authService.logout();
    }
  }
}