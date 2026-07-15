import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import Swal from 'sweetalert2';
import config from '../../config';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {
    
  } // เพิ่ม Router ใน constructor
  name: string = '';
  level: string = '';
  empNo: string = '';

  ngOnInit() {
    // this.authService.refreshComponents$.subscribe(() => {
    //   this.loadUserData();
    // });
    // this.name = localStorage.getItem('angular_name')!;
    // this.empNo = localStorage.getItem('angular_empNo')!;
    // if (!this.name) {
    //   // เปลี่ยนเส้นทางไปที่หน้า LoginPage ก่อน
    //   this.router.navigate(['/']).then(() => {
    //     // this.router.navigate(['/FinishGoods']).then(() => {
    //     // แสดง Swal หลังจากเปลี่ยนหน้าเรียบร้อยแล้ว
    //     Swal.fire({
    //       title: 'กรุณาเข้าสู่ระบบ',
    //       text: 'คุณยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อนดำเนินการ',
    //       icon: 'warning',
    //       confirmButtonText: 'ตกลง',
    //     });
    //   });
    // }
    
  }

  async signout() {
    const button = await Swal.fire({
      title: 'ออกจากระบบ',
      text: 'คุณต้องการออกจากระบบ ใช่หรือไม่',
      icon: 'question',
      showCancelButton: true,
      showConfirmButton: true,
    });

    if (button.isConfirmed) {
      // localStorage.removeItem('angular_token');
      // localStorage.removeItem('angular_name');
      // localStorage.removeItem('angular_id');
      // localStorage.removeItem('angular_empNo');
      this.authService.logout();
      // localStorage.removeItem('angular_level');

      // location.reload();
      this.router.navigate(['/signIn']);
      // window.location.href = '/FinishGoods';
    }
  }

  
  loadUserData() {
    this.name = localStorage.getItem('angular_name') || '';
    this.empNo = localStorage.getItem('angular_empNo') || '';

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
}
