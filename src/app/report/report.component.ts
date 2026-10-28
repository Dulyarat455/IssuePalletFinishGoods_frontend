import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';
import config from '../../config';

type TransactionType = 'create' | 'add' | 'move';

type TransactionHeader = {
  headId: number;

  labelNo: string;

  itemNo: string;

  itemName: string;

  normalQty: number;

  fractionQty: number;

  controlLot: string;

  groupName: string;
};

type TransactionRow = {
  palletId: number;

  palletNoId: string;

  mapAreaRackId: number;

  rackName: string;

  areaName: string;

  labelType: string;

  palletTimeStmp: string | null;

  updateTimeStmp: string | null;

  typeCase: TransactionType;

  header?: TransactionHeader[];

  endAreaRackId?: number;

  endRackName?: string;

  endAreaName?: string;

  userId: number;

  empNo: string;

  name: string;
};

type TransactionListResponse = {
  message?: string;

  chunkSize?: number;

  total?: number;

  summary?: {
    create?: number;
    add?: number;
    move?: number;
  };

  results?: TransactionRow[];
};

@Component({
  selector: 'app-report',
  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './report.component.html',

  styleUrl: './report.component.css',
})
export class ReportComponent implements OnInit {
  // =====================================================
  // DATA
  // =====================================================

  rows: TransactionRow[] = [];

  filteredRows: TransactionRow[] = [];

  // =====================================================
  // STATE
  // =====================================================

  isLoading = false;

  expandedRows = new Set<string>();

  // =====================================================
  // FILTER
  // =====================================================

  searchPalletNo = '';

  searchType = '';

  searchRack = '';

  searchArea = '';

  searchUser = '';

  startDate = '';

  endDate = '';

  constructor(private http: HttpClient) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.fetchData();
  }

  // =====================================================
  // FETCH DATA
  // =====================================================

  fetchData(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.http
      .get<TransactionListResponse>(
        config.apiServer + '/api/transactionAll/list'
      )
      .subscribe({
        next: (res) => {
          const data = Array.isArray(res?.results) ? res.results : [];

          // ===============================================
          // NEWEST FIRST
          // Backend sort มาอยู่แล้ว
          // แต่ frontend sort ซ้ำกันไว้
          // ===============================================

          this.rows = [...data].sort((a, b) => {
            const timeA = new Date(a.updateTimeStmp || 0).getTime();

            const timeB = new Date(b.updateTimeStmp || 0).getTime();

            return timeB - timeA;
          });

          this.applyFilter();

          this.isLoading = false;
        },

        error: (err) => {
          this.isLoading = false;

          Swal.fire({
            title: 'Load Report Failed',

            text:
              err?.error?.error ||
              err?.error?.message ||
              err?.message ||
              'Cannot load transaction report',

            icon: 'error',

            confirmButtonText: 'OK',

            confirmButtonColor: '#14b89a',
          });
        },
      });
  }

  // =====================================================
  // FILTER
  // =====================================================

  applyFilter(): void {
    const palletNo = this.searchPalletNo.trim().toLowerCase();

    const type = this.searchType.trim().toLowerCase();

    const rack = this.searchRack.trim().toLowerCase();

    const area = this.searchArea.trim().toLowerCase();

    const user = this.searchUser.trim().toLowerCase();

    const startTime = this.startDate
      ? new Date(this.startDate + 'T00:00:00').getTime()
      : null;

    const endTime = this.endDate
      ? new Date(this.endDate + 'T23:59:59.999').getTime()
      : null;

    this.filteredRows = this.rows.filter((row) => {
      const rowPalletNo = String(row.palletNoId || '').toLowerCase();

      const rowType = String(row.typeCase || '').toLowerCase();

      // ===============================================
      // Search Rack ทั้งต้นทาง / ปลายทาง
      // ===============================================

      const rowRack = [row.rackName, row.endRackName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // ===============================================
      // Search Area ทั้งต้นทาง / ปลายทาง
      // ===============================================

      const rowArea = [row.areaName, row.endAreaName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const rowUser = [row.empNo, row.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const updateTime = row.updateTimeStmp
        ? new Date(row.updateTimeStmp).getTime()
        : null;

      const matchDate =
        (startTime == null ||
          (updateTime != null && updateTime >= startTime)) &&
        (endTime == null || (updateTime != null && updateTime <= endTime));

      return (
        (!palletNo || rowPalletNo.includes(palletNo)) &&
        (!type || rowType === type) &&
        (!rack || rowRack.includes(rack)) &&
        (!area || rowArea.includes(area)) &&
        (!user || rowUser.includes(user)) &&
        matchDate
      );
    });
  }

  // =====================================================
  // CLEAR FILTER
  // =====================================================

  clearFilter(): void {
    this.searchPalletNo = '';

    this.searchType = '';

    this.searchRack = '';

    this.searchArea = '';

    this.searchUser = '';

    this.startDate = '';

    this.endDate = '';

    this.applyFilter();
  }

  // =====================================================
  // SUMMARY
  // =====================================================

  get totalCreate(): number {
    return this.rows.filter((row) => row.typeCase === 'create').length;
  }

  get totalAdd(): number {
    return this.rows.filter((row) => row.typeCase === 'add').length;
  }

  get totalMove(): number {
    return this.rows.filter((row) => row.typeCase === 'move').length;
  }

  // =====================================================
  // EXPAND
  // =====================================================

  toggleRow(row: TransactionRow, index: number): void {
    if (!row.header || row.header.length === 0) {
      return;
    }

    const key = this.getRowKey(row, index);

    if (this.expandedRows.has(key)) {
      this.expandedRows.delete(key);
    } else {
      this.expandedRows.add(key);
    }
  }

  isExpanded(row: TransactionRow, index: number): boolean {
    return this.expandedRows.has(this.getRowKey(row, index));
  }

  getRowKey(row: TransactionRow, index: number): string {
    return [row.typeCase, row.palletId, row.updateTimeStmp || '', index].join(
      '_'
    );
  }

  // =====================================================
  // HEADER COUNT
  // =====================================================

  getHeaderCount(row: TransactionRow): number {
    return Array.isArray(row.header) ? row.header.length : 0;
  }

  // =====================================================
  // FORMAT TYPE
  // =====================================================

  getTypeText(type: TransactionType): string {
    switch (type) {
      case 'create':
        return 'Create Pallet';

      case 'add':
        return 'Add Header';

      case 'move':
        return 'Move Pallet';

      default:
        return type;
    }
  }

  // =====================================================
  // FORMAT LOCATION
  // =====================================================

  getLocationText(row: TransactionRow): string {
    const rack = String(row.rackName || '').trim();

    const area = String(row.areaName || '').trim();

    if (rack && area) {
      return rack + ' / ' + area;
    }

    return area || rack || '-';
  }

  getEndLocationText(row: TransactionRow): string {
    if (row.typeCase !== 'move') {
      return '-';
    }

    const rack = String(row.endRackName || '').trim();

    const area = String(row.endAreaName || '').trim();

    if (rack && area) {
      return rack + ' / ' + area;
    }

    return area || rack || '-';
  }

  // =====================================================
  // FORMAT DATE
  // =====================================================

  formatDate(value?: string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const day = String(date.getDate()).padStart(2, '0');

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const year = date.getFullYear();

    const hour = String(date.getHours()).padStart(2, '0');

    const minute = String(date.getMinutes()).padStart(2, '0');

    const second = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ` + `${hour}:${minute}:${second}`;
  }

  // =====================================================
  // TRACK BY
  // =====================================================

  trackByRow(index: number, row: TransactionRow): string {
    return this.getRowKey(row, index);
  }

  trackByHeader(index: number, header: TransactionHeader): number {
    return header.headId || index;
  }
}
