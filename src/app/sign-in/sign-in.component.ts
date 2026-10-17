import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import config from '../../config';
import Swal from 'sweetalert2';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css',
})
export class SignInComponent {
  @ViewChild('rfidInput') rfidInput!: ElementRef;

  token: string | undefined = '';
  username: string = '';
  password: string = '';
  empNo: string = '';
  rfid: string = '';
  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // this.token = localStorage.getItem('angular_token')!;
    // this.empNo = localStorage.getItem('angular_empNo')!

    //localstorage ให้เปลี่ยนชื่อ token ทุกจุดตาม Project ที่ทำ

    if (localStorage.getItem('angular_token')) {
      this.token = localStorage.getItem('angular_token')!;
      this.empNo = localStorage.getItem('angular_empNo')!;
    } else {
      this.token = undefined;
      this.empNo = '';
    }
  }

  ngAfterViewInit() {
    this.focusRFIDInput();
  }

  // Helper function to focus RFID input
  private focusRFIDInput(): void {
    setTimeout(() => {
      if (this.rfidInput && !this.isLoading) {
        this.rfidInput.nativeElement.focus();
      }
    }, 0);
  }

  // Reset login state
  private resetLoginState(): void {
    this.isLoading = false;

    this.rfid = '';

    if (this.rfidInput) {
      this.rfidInput.nativeElement.value = '';
    }

    this.focusRFIDInput();
  }

  // Handle RFID input
  onRFIDInput(event: Event): void {

    if (this.isLoading) {
      return;
    }
  
  
    const input =
      event.target as HTMLInputElement;
  
  
    const value =
      String(input.value || '').trim();
  
  
    this.rfid = value;
  
  
    // =====================================================
    // RFID ต้องครบ 10 ตัว
    // ครบแล้ว Login อัตโนมัติ
    // =====================================================
  
    if (value.length === 10) {
  
      this.signInWithRFID(value);
  
    }
  
  }

  // RFID Login
  signInWithRFID(rfidValue: string): void {

    // =====================================================
    // PREVENT DOUBLE CALL
    // =====================================================
  
    if (this.isLoading) {
      return;
    }
  
  
    const rfId =
      String(rfidValue || '').trim();
  
  
    // =====================================================
    // VALIDATE RFID
    // =====================================================
  
    if (rfId.length !== 10) {
  
      this.resetLoginState();
  
      return;
  
    }
  
  
    // =====================================================
    // LOADING
    // =====================================================
  
    this.isLoading = true;
  
  
    // =====================================================
    // PAYLOAD
    //
    // IMPORTANT:
    // Backend รับชื่อ rfId
    // =====================================================
  
    const payload = {
      rfId: rfId,
    };
  
  
    // =====================================================
    // CALL API
    // =====================================================
  
    this.http
      .post<any>(
        config.apiServer +
          '/api/user/signInRfId',
  
        payload
      )
      .subscribe({
  
        // =================================================
        // SUCCESS
        // =================================================
  
        next: (res: any): void => {
  
          // ===============================================
          // CHECK TOKEN
          // ===============================================
  
          if (!res?.token) {
  
            this.resetLoginState();
  
  
            Swal.fire({
              title:
                'ไม่สามารถเข้าสู่ระบบได้',
  
              text:
                'ไม่พบ Token จากระบบ',
  
              icon: 'error',
  
              timer: 2000,
  
            }).then(() => {
  
              this.focusRFIDInput();
  
            });
  
  
            return;
  
          }
  
  
          // ===============================================
          // LOGIN
          //
          // เก็บ Token / User / Group / Section
          // ผ่าน AuthService เดิม
          // ===============================================
  
          this.authService.login(res);
  
  
          // ===============================================
          // SUCCESS MESSAGE
          // ===============================================
  
          Swal.fire({
  
            title:
              'เข้าสู่ระบบสำเร็จ',
  
            text:
              `ยินดีต้อนรับ ${res.name}`,
  
            icon: 'success',
  
            timer: 1500,
  
            showConfirmButton: false,
  
          }).then(() => {
  
            // =============================================
            // GO HOME
            // =============================================
  
            this.router.navigate(['/']);
  
  
            // ใช้ชื่อ LocalStorage เดิมของ Project
            this.token =
              localStorage.getItem(
                'angular_token'
              )!;
  
  
            this.empNo =
              localStorage.getItem(
                'angular_empNo'
              )!;
  
          });
  
        },
  
  
        // =================================================
        // ERROR
        // =================================================
  
        error: (error: any): void => {
  
          console.error(
            'RFID Login Error:',
            error
          );
  
  
          const message =
            error?.error?.message ||
            'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
  
  
          // ===============================================
          // CLEAR + FOCUS RFID
          // ===============================================
  
          this.resetLoginState();
  
  
          // ===============================================
          // RFID NOT FOUND
          // ===============================================
  
          if (
            message ===
            'unauthorized'
          ) {
  
            Swal.fire({
  
              title:
                'ไม่สามารถเข้าสู่ระบบได้',
  
              text:
                'ไม่พบ RFID หรือไม่มีสิทธิ์ในการเข้าถึง',
  
              icon: 'error',
  
              timer: 2000,
  
              showConfirmButton: false,
  
            }).then(() => {
  
              this.focusRFIDInput();
  
            });
  
  
            return;
  
          }
  
  
          // ===============================================
          // OTHER ERROR
          // ===============================================
  
          Swal.fire({
  
            title:
              'ไม่สามารถเข้าสู่ระบบได้',
  
            text: message,
  
            icon: 'error',
  
            timer: 2000,
  
            showConfirmButton: false,
  
          }).then(() => {
  
            this.focusRFIDInput();
  
          });
  
        },
  
      });
  
  }

  // Regular login
  signIn() {
    if (this.empNo == '' || this.password == '') {
      Swal.fire({
        title: 'ตรวจสอบข้อมูล',
        text: 'โปรดกรอก username หรือ password ด้วย',
        icon: 'error',
      });
      return;
    }

    this.isLoading = true;
    const payload = {
      empNo: this.empNo,
      password: this.password,
    };

    try {
      this.http.post(config.apiServer + '/api/user/signIn', payload).subscribe({
        next: (res: any) => {
          if (res.message === 'unauthorized') {
            this.isLoading = false;
            Swal.fire({
              title: 'ไม่สามารถเข้าสู่ระบบได้',
              text: 'ไม่มีสิทธิ์ในการเข้าถึง',
              icon: 'error',
              timer: 2000,
            });
            return;
          }

          // this.token = res.token;
          // localStorage.setItem('angular_token', this.token);
          // localStorage.setItem('angular_name', res.name);
          // localStorage.setItem('angular_id', res.id);
          // localStorage.setItem('angular_empNo', res.empNo);

          this.authService.login(res);

          Swal.fire({
            title: 'เข้าสู่ระบบสำเร็จ',
            text: `ยินดีต้อนรับ ${res.name}`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: true,
          }).then(() => {
            // location.reload();
            this.router.navigate(['/']);
            this.token = localStorage.getItem('angular_token')!;
            this.empNo = localStorage.getItem('angular_empNo')!;
          });
        },
        error: (error) => {
          this.isLoading = false;
          const errorMessage =
            error.error?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';

          if (error.error?.message === 'unauthorized') {
            Swal.fire({
              title: 'ไม่สามารถเข้าสู่ระบบได้',
              text: 'ไม่มีสิทธิ์ในการเข้าถึง',
              icon: 'error',
              timer: 2000,
            });
            return;
          }

          Swal.fire({
            title: 'ตรวจสอบข้อมูล',
            text: errorMessage,
            icon: 'error',
          });
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    } catch (e: any) {
      this.isLoading = false;
      Swal.fire({
        title: 'error',
        text: e.message,
        icon: 'error',
      });
    }
  }

  // Clear all inputs
  clearInputs(type: 'rfid' | 'employee' | 'all' = 'all') {
    if (type === 'rfid' || type === 'all') {
      if (this.rfidInput) {
        this.rfidInput.nativeElement.value = '';
      }
      this.rfid = '';
      this.focusRFIDInput();
    }

    if (type === 'employee' || type === 'all') {
      this.empNo = '';
      this.password = '';
    }
  }
}
