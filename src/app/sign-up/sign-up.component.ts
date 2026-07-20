import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';
import config from '../../config';

type UserRow = {
  id: number;
  name: string;
  empNo: string;
  password?: string;
  rfId: string;
  role: string;
  status: string;

  mapGroupSectionUserId?: number | null;

  groupId?: number | null;
  groupName?: string;

  sectionId?: number | null;
  sectionName?: string;

  mapGroupSectionUsers?: {
    id: number;
    userId: number;
    groupId: number;
    groupName: string;
    sectionId: number;
    sectionName: string;
    status: string;
  }[];
};

type GroupRow = {
  id: number;
  name: string;
  status?: string;
};

type SectionRow = {
  id: number;
  name: string;
  status?: string;
};

type UserListResp = {
  results: UserRow[];
};

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
})
export class SignUpComponent implements OnInit {
  users: UserRow[] = [];
  groups: GroupRow[] = [];
  sections: SectionRow[] = [];

  isLoading = false;
  isSaving = false;
  isLoadingGroup = false;
  isLoadingSection = false;

  keyword = '';
  roleFilter = 'All';
  groupFilter = 'All';
  sectionFilter = 'All';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchGroups();
    this.fetchSections();
    this.fetchUsers();
  }

  get filteredUsers(): UserRow[] {
    const kw = this.keyword.trim().toLowerCase();

    return this.users.filter((u) => {
      const searchText = `
        ${u.name || ''}
        ${u.empNo || ''}
        ${u.rfId || ''}
        ${u.role || ''}
        ${u.groupName || ''}
        ${u.sectionName || ''}
      `.toLowerCase();

      if (kw && !searchText.includes(kw)) return false;

      if (this.roleFilter !== 'All' && u.role !== this.roleFilter) {
        return false;
      }

      if (this.groupFilter !== 'All' && String(u.groupId) !== String(this.groupFilter)) {
        return false;
      }

      if (this.sectionFilter !== 'All' && String(u.sectionId) !== String(this.sectionFilter)) {
        return false;
      }

      return true;
    });
  }

  get totalUsers(): number {
    return this.users.length;
  }

  get adminCount(): number {
    return this.users.filter((x) => String(x.role).toLowerCase() === 'admin').length;
  }

  get userCount(): number {
    return this.users.filter((x) => String(x.role).toLowerCase() === 'user').length;
  }

  get groupCount(): number {
    const set = new Set(this.users.map((x) => x.groupName).filter(Boolean));
    return set.size;
  }

  fetchGroups() {
    this.isLoadingGroup = true;

    this.http.get(config.apiServer + '/api/group/list').subscribe({
      next: (res: any) => {
        this.groups = (res.results || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          status: r.status,
        }));

        this.isLoadingGroup = false;
      },
      error: (err) => {
        this.isLoadingGroup = false;

        Swal.fire({
          title: 'Error',
          text: err?.error?.message || err.message || 'Load group fail',
          icon: 'error',
        });
      },
    });
  }

  fetchSections() {
    this.isLoadingSection = true;

    this.http.get(config.apiServer + '/api/section/list').subscribe({
      next: (res: any) => {
        this.sections = (res.results || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          status: r.status,
        }));

        this.isLoadingSection = false;
      },
      error: (err) => {
        this.isLoadingSection = false;

        Swal.fire({
          title: 'Error',
          text: err?.error?.message || err.message || 'Load section fail',
          icon: 'error',
        });
      },
    });
  }

  fetchUsers() {
    this.isLoading = true;

    this.http.post<UserListResp>(config.apiServer + '/api/user/list', {}).subscribe({
      next: (res: UserListResp) => {
        this.users = (res.results || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          empNo: r.empNo,
          password: r.password,
          rfId: r.rfId,
          role: r.role,
          status: r.status,

          mapGroupSectionUserId: r.mapGroupSectionUserId ?? null,

          groupId: r.groupId ?? null,
          groupName: r.groupName || '-',

          sectionId: r.sectionId ?? null,
          sectionName: r.sectionName || '-',

          mapGroupSectionUsers: r.mapGroupSectionUsers || [],
        }));

        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;

        Swal.fire({
          title: 'Error',
          text: err?.error?.message || err.message || 'Load user list fail',
          icon: 'error',
        });
      },
    });
  }

  resetFilters() {
    this.keyword = '';
    this.roleFilter = 'All';
    this.groupFilter = 'All';
    this.sectionFilter = 'All';
  }

  async openCreateUserModal() {
    if (this.isLoadingGroup || this.isLoadingSection) {
      Swal.fire('Please wait', 'กำลังโหลด Group / Section', 'info');
      return;
    }
  
    if (!this.groups.length || !this.sections.length) {
      Swal.fire('Warning', 'ยังไม่มี Group หรือ Section กรุณาสร้าง master ก่อน', 'warning');
      return;
    }
  
    const groupOptions = this.groups
      .map((g) => `<option value="${g.id}">${this.escapeHtml(g.name)}</option>`)
      .join('');
  
    const sectionOptions = this.sections
      .map((s) => `<option value="${s.id}">${this.escapeHtml(s.name)}</option>`)
      .join('');
  
    const modalStyle = `
      <style>
        .fg-member-popup {
          width: 760px !important;
          max-width: calc(100vw - 24px) !important;
          border-radius: 26px !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #ffffff !important;
          box-shadow: 0 26px 70px rgba(15, 23, 42, 0.22) !important;
        }
  
        .fg-member-popup .swal2-html-container {
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }
  
        .fg-member-popup .swal2-actions {
          width: 100%;
          margin: 0 !important;
          padding: 0 30px 30px !important;
          gap: 12px !important;
          justify-content: flex-end !important;
        }
  
        .fg-member-modal {
          text-align: left;
          background:
            radial-gradient(circle at top left, rgba(16, 185, 129, 0.14), transparent 35%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          padding: 30px 30px 22px;
        }
  
        .fg-member-head {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
  
        .fg-member-icon {
          width: 66px;
          height: 66px;
          border-radius: 22px;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          box-shadow: 0 14px 28px rgba(20, 184, 166, 0.26);
          flex: 0 0 auto;
        }
  
        .fg-member-title h2 {
          margin: 0;
          color: #0f172a;
          font-size: 32px;
          font-weight: 950;
          letter-spacing: -0.7px;
          line-height: 1.05;
        }
  
        .fg-member-title p {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 650;
        }
  
        .fg-member-section-title {
          margin: 18px 0 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #0f766e;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 1.3px;
          text-transform: uppercase;
        }
  
        .fg-member-section-title::before {
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #10b981;
          box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.12);
        }
  
        .fg-member-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }
  
        .fg-member-field {
          min-width: 0;
        }
  
        .fg-member-field.wide {
          grid-column: 1 / -1;
        }
  
        .fg-member-field label {
          display: block;
          margin: 0 0 7px;
          color: #334155;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.25px;
        }
  
        .fg-input-box {
          position: relative;
          width: 100%;
          min-width: 0;
        }
  
        .fg-input-box .fg-left-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 14px;
          pointer-events: none;
          z-index: 2;
        }
  
        .fg-input-box input,
        .fg-input-box select {
          width: 100% !important;
          height: 48px !important;
          margin: 0 !important;
          padding: 0 48px 0 43px !important;
          border: 1px solid #dbe4ea !important;
          border-radius: 16px !important;
          background: #ffffff !important;
          color: #0f172a !important;
          font-size: 14px !important;
          font-weight: 750 !important;
          outline: none !important;
          box-shadow: 0 1px 0 rgba(15, 23, 42, 0.02) !important;
          transition: 0.16s ease !important;
        }
  
        .fg-input-box input::placeholder {
          color: #a8b3c2 !important;
          font-weight: 650 !important;
        }
  
        .fg-input-box input:focus,
        .fg-input-box select:focus {
          border-color: #14b8a6 !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.13) !important;
        }
  
        .fg-input-box input:focus ~ .fg-left-icon,
        .fg-input-box select:focus ~ .fg-left-icon {
          color: #14b8a6 !important;
        }
  
        .fg-input-box select {
          appearance: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          cursor: pointer;
        }
  
        .fg-select-arrow {
          position: absolute;
          right: 17px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
          font-size: 17px;
          font-weight: 950;
          line-height: 1;
          z-index: 3;
        }
  
        .fg-modal-note {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 16px;
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          color: #047857;
          font-size: 12px;
          font-weight: 750;
          display: flex;
          align-items: flex-start;
          gap: 9px;
        }
  
        .fg-modal-note i {
          margin-top: 2px;
        }
  
        .fg-confirm-btn,
        .fg-cancel-btn {
          min-width: 142px !important;
          height: 46px !important;
          border: 0 !important;
          border-radius: 15px !important;
          font-size: 14px !important;
          font-weight: 950 !important;
          padding: 0 18px !important;
          transition: 0.16s ease !important;
          cursor: pointer !important;
        }
  
        .fg-confirm-btn {
          background: linear-gradient(135deg, #10b981, #14b8a6) !important;
          color: #ffffff !important;
          box-shadow: 0 12px 22px rgba(16, 185, 129, 0.24) !important;
        }
  
        .fg-confirm-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 28px rgba(16, 185, 129, 0.30) !important;
        }
  
        .fg-cancel-btn {
          background: #eef2f7 !important;
          color: #475569 !important;
        }
  
        .fg-cancel-btn:hover {
          background: #e2e8f0 !important;
        }
  
        .fg-member-popup .swal2-validation-message {
          margin: 0 30px 18px !important;
          border-radius: 15px !important;
          background: #fff7ed !important;
          color: #c2410c !important;
          font-weight: 850 !important;
        }
  
        @media (max-width: 768px) {
          .fg-member-modal {
            padding: 22px 18px 16px;
          }
  
          .fg-member-head {
            align-items: flex-start;
          }
  
          .fg-member-icon {
            width: 54px;
            height: 54px;
            border-radius: 18px;
            font-size: 21px;
          }
  
          .fg-member-title h2 {
            font-size: 26px;
          }
  
          .fg-member-grid {
            grid-template-columns: minmax(0, 1fr);
          }
  
          .fg-member-field.wide {
            grid-column: auto;
          }
  
          .fg-member-popup .swal2-actions {
            padding: 0 18px 20px !important;
            flex-direction: column-reverse !important;
          }
  
          .fg-confirm-btn,
          .fg-cancel-btn {
            width: 100% !important;
          }
        }
      </style>
    `;
  
    const result = await Swal.fire({
      title: '',
      width: 760,
      padding: 0,
      customClass: {
        popup: 'fg-member-popup',
        confirmButton: 'fg-confirm-btn',
        cancelButton: 'fg-cancel-btn',
      },
      buttonsStyling: false,
      showCancelButton: true,
      confirmButtonText: 'Create Member',
      cancelButtonText: 'Cancel',
      focusConfirm: false,
      html: `
        ${modalStyle}
  
        <div class="fg-member-modal">
          <div class="fg-member-head">
            <div class="fg-member-icon">
              <i class="fas fa-user-plus"></i>
            </div>
  
            <div class="fg-member-title">
              <h2>Add Member</h2>
              <p>Create a new user account for Finish Goods Pallet system.</p>
            </div>
          </div>
  
          <div class="fg-member-section-title">
            Account Information
          </div>
  
          <div class="fg-member-grid">
            <div class="fg-member-field">
              <label>Name</label>
              <div class="fg-input-box">
                <input id="swal-name" placeholder="Enter employee name">
                <i class="fas fa-user fg-left-icon"></i>
              </div>
            </div>
  
            <div class="fg-member-field">
              <label>Emp No.</label>
              <div class="fg-input-box">
                <input id="swal-empNo" placeholder="Enter employee number">
                <i class="fas fa-id-badge fg-left-icon"></i>
              </div>
            </div>
  
            <div class="fg-member-field">
              <label>Password</label>
              <div class="fg-input-box">
                <input id="swal-password" type="text" placeholder="Enter password">
                <i class="fas fa-lock fg-left-icon"></i>
              </div>
            </div>
  
            <div class="fg-member-field">
              <label>RFID</label>
              <div class="fg-input-box">
                <input id="swal-rfId" placeholder="Enter RFID card number">
                <i class="fas fa-id-card fg-left-icon"></i>
              </div>
            </div>
          </div>
  
          <div class="fg-member-section-title">
            Permission
          </div>
  
          <div class="fg-member-grid">
            <div class="fg-member-field">
              <label>Role</label>
              <div class="fg-input-box">
                <select id="swal-role">
                  <option value="" disabled selected>Select role</option>
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                </select>
                <i class="fas fa-user-shield fg-left-icon"></i>
                <span class="fg-select-arrow">▾</span>
              </div>
            </div>
  
            <div class="fg-member-field">
              <label>Group</label>
              <div class="fg-input-box">
                <select id="swal-groupId">
                  <option value="" disabled selected>Select group</option>
                  ${groupOptions}
                </select>
                <i class="fas fa-layer-group fg-left-icon"></i>
                <span class="fg-select-arrow">▾</span>
              </div>
            </div>
  
            <div class="fg-member-field wide">
              <label>Section</label>
              <div class="fg-input-box">
                <select id="swal-sectionId">
                  <option value="" disabled selected>Select section</option>
                  ${sectionOptions}
                </select>
                <i class="fas fa-sitemap fg-left-icon"></i>
                <span class="fg-select-arrow">▾</span>
              </div>
            </div>
          </div>
  
          <div class="fg-modal-note">
            <i class="fas fa-circle-info"></i>
            <div>
              Member will be created with RFID login, role permission, group and section mapping.
            </div>
          </div>
        </div>
      `,
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement)?.value.trim();
        const empNo = (document.getElementById('swal-empNo') as HTMLInputElement)?.value.trim();
        const password = (document.getElementById('swal-password') as HTMLInputElement)?.value.trim();
        const rfId = (document.getElementById('swal-rfId') as HTMLInputElement)?.value.trim();
        const role = (document.getElementById('swal-role') as HTMLSelectElement)?.value;
        const groupId = (document.getElementById('swal-groupId') as HTMLSelectElement)?.value;
        const sectionId = (document.getElementById('swal-sectionId') as HTMLSelectElement)?.value;
  
        if (!name || !empNo || !password || !rfId || !role || !groupId || !sectionId) {
          Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบ');
          return false;
        }
  
        return {
          name,
          empNo,
          password,
          rfId,
          role,
          groupId: Number(groupId),
          sectionId: Number(sectionId),
        };
      },
    });
  
    if (!result.isConfirmed || !result.value) return;
  
    this.createUser(result.value);
  }

  createUser(payload: {
    name: string;
    empNo: string;
    password: string;
    rfId: string;
    role: string;
    groupId: number;
    sectionId: number;
  }) {
    this.isSaving = true;

    Swal.fire({
      title: 'Creating member...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.http.post(config.apiServer + '/api/user/create', payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;

        Swal.fire({
          icon: 'success',
          title: 'Create Success',
          text: 'เพิ่ม Member สำเร็จ',
          confirmButtonColor: '#10b981',
        });

        this.fetchUsers();
      },
      error: (err) => {
        this.isSaving = false;

        const msg = err?.error?.message || err?.error?.error || err.message || 'Create member fail';

        if (msg === 'User_name_already') {
          Swal.fire('Warning', 'Emp No. นี้ถูกใช้งานแล้ว', 'warning');
          return;
        }

        if (msg === 'missing_required_fields') {
          Swal.fire('Warning', 'กรุณากรอกข้อมูลให้ครบ', 'warning');
          return;
        }

        Swal.fire('Error', msg, 'error');
      },
    });
  }




  openUserDetailModal(user: UserRow) {
    const roleClass = user.role === 'admin' ? 'admin' : 'user';
  
    const detailStyle = `
      <style>
        .fg-detail-popup {
          width: 640px !important;
          max-width: calc(100vw - 24px) !important;
          border-radius: 24px !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #ffffff !important;
          box-shadow: 0 26px 70px rgba(15, 23, 42, 0.22) !important;
        }
  
        .fg-detail-popup .swal2-html-container {
          margin: 0 !important;
          padding: 0 !important;
        }
  
        .fg-detail-modal {
          text-align: left;
          padding: 28px 28px 8px;
          background:
            radial-gradient(circle at top left, rgba(16, 185, 129, 0.14), transparent 35%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }
        
        .fg-detail-popup .swal2-actions {
          width: 100%;
          margin: 0 !important;
          padding: 18px 28px 34px !important;
          background: #ffffff;
          justify-content: center !important;
        }
  
        .fg-detail-head {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 22px;
        }
  
        .fg-detail-avatar {
          width: 64px;
          height: 64px;
          border-radius: 22px;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          font-weight: 950;
          box-shadow: 0 14px 28px rgba(20, 184, 166, 0.26);
          flex: 0 0 auto;
        }
  
        .fg-detail-title h2 {
          margin: 0;
          color: #0f172a;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -0.5px;
        }
  
        .fg-detail-title p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
        }
  
        .fg-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
  
        .fg-detail-item {
          min-width: 0;
          padding: 14px;
          border-radius: 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
        }
  
        .fg-detail-item.wide {
          grid-column: 1 / -1;
        }
  
        .fg-detail-item span {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #64748b;
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 7px;
        }
  
        .fg-detail-item b {
          display: block;
          color: #0f172a;
          font-size: 15px;
          font-weight: 900;
          word-break: break-word;
        }
  
        .fg-password-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 14px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
          font-family: Consolas, 'Courier New', monospace;
          font-size: 15px;
          font-weight: 950;
          word-break: break-all;
        }
  
        .fg-role-chip {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 950;
        }
  
        .fg-role-chip.admin {
          background: #f5f3ff;
          color: #6d28d9;
          border: 1px solid #ddd6fe;
        }
  
        .fg-role-chip.user {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #bbf7d0;
        }
  
        .fg-status-chip {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f0fdfa;
          color: #0f766e;
          border: 1px solid #ccfbf1;
          font-size: 12px;
          font-weight: 950;
        }
  
        .fg-detail-note {
          margin-top: 14px;
          padding: 12px 14px;
          border-radius: 16px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 750;
          display: flex;
          align-items: flex-start;
          gap: 9px;
        }
  
        .fg-detail-ok {
          min-width: 120px !important;
          height: 44px !important;
          border: 0 !important;
          border-radius: 14px !important;
          background: linear-gradient(135deg, #10b981, #14b8a6) !important;
          color: #ffffff !important;
          font-size: 14px !important;
          font-weight: 950 !important;
          box-shadow: 0 12px 22px rgba(16, 185, 129, 0.24) !important;
        }
  
        @media (max-width: 640px) {
          .fg-detail-modal {
            padding: 22px 18px;
          }
  
          .fg-detail-grid {
            grid-template-columns: minmax(0, 1fr);
          }
  
          .fg-detail-item.wide {
            grid-column: auto;
          }
  
          .fg-detail-head {
            align-items: flex-start;
          }
        }
      </style>
    `;
  
    Swal.fire({
      title: '',
      width: 640,
      padding: 0,
      customClass: {
        popup: 'fg-detail-popup',
        confirmButton: 'fg-detail-ok',
      },
      buttonsStyling: false,
      confirmButtonText: 'Close',
      html: `
        ${detailStyle}
  
        <div class="fg-detail-modal">
          <div class="fg-detail-head">
            <div class="fg-detail-avatar">
              ${this.escapeHtml(user.name ? user.name.charAt(0).toUpperCase() : 'U')}
            </div>
  
            <div class="fg-detail-title">
              <h2>${this.escapeHtml(user.name || '-')}</h2>
              <p>${this.escapeHtml(user.empNo || '-')} / ${this.escapeHtml(user.sectionName || '-')}</p>
            </div>
          </div>
  
          <div class="fg-detail-grid">
            <div class="fg-detail-item">
              <span><i class="fas fa-id-badge"></i> Emp No.</span>
              <b>${this.escapeHtml(user.empNo || '-')}</b>
            </div>
  
            <div class="fg-detail-item">
              <span><i class="fas fa-id-card"></i> RFID</span>
              <b>${this.escapeHtml(user.rfId || '-')}</b>
            </div>
  
            <div class="fg-detail-item">
              <span><i class="fas fa-user-shield"></i> Role</span>
              <b>
                <span class="fg-role-chip ${roleClass}">
                  ${this.escapeHtml(user.role || '-')}
                </span>
              </b>
            </div>
  
            <div class="fg-detail-item">
              <span><i class="fas fa-circle-check"></i> Status</span>
              <b>
                <span class="fg-status-chip">
                  ${this.escapeHtml(user.status || '-')}
                </span>
              </b>
            </div>
  
            <div class="fg-detail-item">
              <span><i class="fas fa-layer-group"></i> Group</span>
              <b>${this.escapeHtml(user.groupName || '-')}</b>
            </div>
  
            <div class="fg-detail-item">
              <span><i class="fas fa-sitemap"></i> Section</span>
              <b>${this.escapeHtml(user.sectionName || '-')}</b>
            </div>
  
            <div class="fg-detail-item wide">
              <span><i class="fas fa-key"></i> Password</span>
              <div class="fg-password-box">
                ${this.escapeHtml(user.password || '-')}
              </div>
            </div>
          </div>
  
          <div class="fg-detail-note">
            <i class="fas fa-circle-info"></i>
            <div>
              Password is shown for administrator checking. Please keep this information confidential.
            </div>
          </div>
        </div>
      `,
    });
  }

  private escapeHtml(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}