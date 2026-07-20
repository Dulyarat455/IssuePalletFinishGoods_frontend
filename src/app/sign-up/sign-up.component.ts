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
  status: string;
};

type SectionRow = {
  id: number;
  name: string;
  status: string;
};

type UserListResp = {
  results: UserRow[];
};

type MasterResp<T> = {
  results: T[];
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

  keyword = '';
  roleFilter = 'All';
  groupFilter = 'All';
  sectionFilter = 'All';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchMasters();
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

      if (this.roleFilter !== 'All' && u.role !== this.roleFilter) return false;

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

  fetchMasters() {
    Promise.all([
      this.http.get<MasterResp<GroupRow>>(config.apiServer + '/api/group/list').toPromise(),
      this.http.get<MasterResp<SectionRow>>(config.apiServer + '/api/section/list').toPromise(),
    ])
      .then(([groupRes, sectionRes]) => {
        this.groups = groupRes?.results || [];
        this.sections = sectionRes?.results || [];
      })
      .catch((err) => {
        console.error(err);
        Swal.fire('Error', 'Load master data fail', 'error');
      });
  }

  fetchUsers() {
    this.isLoading = true;

    this.http.post<UserListResp>(config.apiServer + '/api/user/list', {}).subscribe({
      next: (res) => {
        this.users = res.results || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        Swal.fire('Error', err?.error?.message || 'Load user list fail', 'error');
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

    const result = await Swal.fire({
      title: 'Add Member',
      width: 720,
      html: `
        <div class="swal-member-form">
          <div class="swal-grid">
            <div class="swal-field">
              <label>Name</label>
              <input id="swal-name" class="swal2-input fg-swal-input" placeholder="Employee name">
            </div>

            <div class="swal-field">
              <label>Emp No.</label>
              <input id="swal-empNo" class="swal2-input fg-swal-input" placeholder="Employee no">
            </div>

            <div class="swal-field">
              <label>Password</label>
              <input id="swal-password" type="password" class="swal2-input fg-swal-input" placeholder="Password">
            </div>

            <div class="swal-field">
              <label>RFID</label>
              <input id="swal-rfId" class="swal2-input fg-swal-input" placeholder="RFID card no">
            </div>

            <div class="swal-field">
              <label>Role</label>
              <select id="swal-role" class="swal2-select fg-swal-select">
                <option value="" disabled selected>Select role</option>
                <option value="admin">admin</option>
                <option value="user">user</option>
              </select>
            </div>

            <div class="swal-field">
              <label>Group</label>
              <select id="swal-groupId" class="swal2-select fg-swal-select">
                <option value="" disabled selected>Select group</option>
                ${groupOptions}
              </select>
            </div>

            <div class="swal-field swal-wide">
              <label>Section</label>
              <select id="swal-sectionId" class="swal2-select fg-swal-select">
                <option value="" disabled selected>Select section</option>
                ${sectionOptions}
              </select>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Create Member',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      focusConfirm: false,
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

    this.http.post<any>(config.apiServer + '/api/user/create', payload).subscribe({
      next: () => {
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

        const msg = err?.error?.message || err?.error?.error || 'Create member fail';

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

  private escapeHtml(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}