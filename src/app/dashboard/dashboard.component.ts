import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

type PalletBoxRow = {
  id: number;
  wosNo: string;
  itemNo: string;
  itemName: string;
  dieNo: string;
  lotNo: string;
  qty: number;
  boxStatus: 'Open' | 'Closed';
};

type IssuedPalletLot = {
  issueDate: string;
  issueTime: string;
  issueNo: string;
  idPallet: string;
  itemNo: string;
  itemName: string;
  dieNo: string;
  lotOqc: string;
  location: string;
  movement: string;
  totalBox: number;
  closedBox: number;
  totalQty: number;
  status: 'Open' | 'Partial Closed' | 'Closed';
  issueBy: string;
  boxes: PalletBoxRow[];
};

type ClosedPalletLot = {
  closeDate: string;
  closeTime: string;
  closeNo: string;
  issueNo: string;
  idPallet: string;
  closeType: 'Full Pallet' | 'Partial Box';
  itemNo: string;
  itemName: string;
  lotOqc: string;
  totalCloseBox: number;
  totalCloseQty: number;
  closeBy: string;
  boxes: PalletBoxRow[];
};

type FilterState = {
  dateFrom: string;
  dateTo: string;
  itemKeyword: string;
  status: string;
  closeType: string;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  filters: FilterState = this.createDefaultFilters();

  expandedIssue: string | null = null;
  expandedClose: string | null = null;

  selectedPreview: IssuedPalletLot | null = null;

  issuedLotsAll: IssuedPalletLot[] = [
    {
      issueDate: '2026-07-15',
      issueTime: '08:35',
      issueNo: 'ISS-FG-260715-001',
      idPallet: 'PALT-260715-001',
      itemNo: '10000206936',
      itemName: 'YOKE#1',
      dieNo: 'D8',
      lotOqc: 'S67001',
      location: 'A101',
      movement: 'Jul-26',
      totalBox: 6,
      closedBox: 0,
      totalQty: 24000,
      status: 'Open',
      issueBy: 'Auto / Store',
      boxes: [
        { id: 1, wosNo: 'JB615021K002', itemNo: '10000206936', itemName: 'YOKE#1', dieNo: 'D8', lotNo: 'L26119AB4', qty: 4000, boxStatus: 'Open' },
        { id: 2, wosNo: 'JB615021K003', itemNo: '10000206936', itemName: 'YOKE#1', dieNo: 'D8', lotNo: 'L26119AB4', qty: 4000, boxStatus: 'Open' },
        { id: 3, wosNo: 'JB615021K004', itemNo: '10000206936', itemName: 'YOKE#1', dieNo: 'D8', lotNo: 'L26119AB4', qty: 4000, boxStatus: 'Open' },
        { id: 4, wosNo: 'JB615021K005', itemNo: '10000206936', itemName: 'YOKE#1', dieNo: 'D8', lotNo: 'L26119AB4', qty: 4000, boxStatus: 'Open' },
        { id: 5, wosNo: 'JB615021K006', itemNo: '10000206936', itemName: 'YOKE#1', dieNo: 'D8', lotNo: 'L26119AB4', qty: 4000, boxStatus: 'Open' },
        { id: 6, wosNo: 'JB615021K007', itemNo: '10000206936', itemName: 'YOKE#1', dieNo: 'D8', lotNo: 'L26119AB4', qty: 4000, boxStatus: 'Open' },
      ],
    },
    {
      issueDate: '2026-07-15',
      issueTime: '10:20',
      issueNo: 'ISS-FG-260715-002',
      idPallet: 'PALT-260715-002',
      itemNo: '10000207111',
      itemName: 'STATOR CORE',
      dieNo: 'S5',
      lotOqc: 'S5X001',
      location: 'B204',
      movement: 'Jul-26',
      totalBox: 8,
      closedBox: 3,
      totalQty: 32000,
      status: 'Partial Closed',
      issueBy: 'Auto / Store',
      boxes: [
        { id: 1, wosNo: 'JB615022K011', itemNo: '10000207111', itemName: 'STATOR CORE', dieNo: 'S5', lotNo: 'L26120AC1', qty: 4000, boxStatus: 'Closed' },
        { id: 2, wosNo: 'JB615022K012', itemNo: '10000207111', itemName: 'STATOR CORE', dieNo: 'S5', lotNo: 'L26120AC1', qty: 4000, boxStatus: 'Closed' },
        { id: 3, wosNo: 'JB615022K013', itemNo: '10000207111', itemName: 'STATOR CORE', dieNo: 'S5', lotNo: 'L26120AC1', qty: 4000, boxStatus: 'Closed' },
        { id: 4, wosNo: 'JB615022K014', itemNo: '10000207111', itemName: 'STATOR CORE', dieNo: 'S5', lotNo: 'L26120AC1', qty: 4000, boxStatus: 'Open' },
        { id: 5, wosNo: 'JB615022K015', itemNo: '10000207111', itemName: 'STATOR CORE', dieNo: 'S5', lotNo: 'L26120AC1', qty: 4000, boxStatus: 'Open' },
      ],
    },
    {
      issueDate: '2026-07-14',
      issueTime: '15:10',
      issueNo: 'ISS-FG-260714-005',
      idPallet: 'PALT-260714-005',
      itemNo: '10000208888',
      itemName: 'FRONT PLATE',
      dieNo: 'F6',
      lotOqc: 'F67001',
      location: 'C302',
      movement: 'Jul-26',
      totalBox: 5,
      closedBox: 5,
      totalQty: 20000,
      status: 'Closed',
      issueBy: 'Auto / Store',
      boxes: [
        { id: 1, wosNo: 'JB615030K001', itemNo: '10000208888', itemName: 'FRONT PLATE', dieNo: 'F6', lotNo: 'L26118AA9', qty: 4000, boxStatus: 'Closed' },
        { id: 2, wosNo: 'JB615030K002', itemNo: '10000208888', itemName: 'FRONT PLATE', dieNo: 'F6', lotNo: 'L26118AA9', qty: 4000, boxStatus: 'Closed' },
      ],
    },
  ];

  closedLotsAll: ClosedPalletLot[] = [
    {
      closeDate: '2026-07-15',
      closeTime: '11:40',
      closeNo: 'CLS-FG-260715-001',
      issueNo: 'ISS-FG-260715-002',
      idPallet: 'PALT-260715-002',
      closeType: 'Partial Box',
      itemNo: '10000207111',
      itemName: 'STATOR CORE',
      lotOqc: 'S5X001',
      totalCloseBox: 3,
      totalCloseQty: 12000,
      closeBy: 'Store FG',
      boxes: [
        { id: 1, wosNo: 'JB615022K011', itemNo: '10000207111', itemName: 'STATOR CORE', dieNo: 'S5', lotNo: 'L26120AC1', qty: 4000, boxStatus: 'Closed' },
        { id: 2, wosNo: 'JB615022K012', itemNo: '10000207111', itemName: 'STATOR CORE', dieNo: 'S5', lotNo: 'L26120AC1', qty: 4000, boxStatus: 'Closed' },
        { id: 3, wosNo: 'JB615022K013', itemNo: '10000207111', itemName: 'STATOR CORE', dieNo: 'S5', lotNo: 'L26120AC1', qty: 4000, boxStatus: 'Closed' },
      ],
    },
    {
      closeDate: '2026-07-14',
      closeTime: '16:25',
      closeNo: 'CLS-FG-260714-003',
      issueNo: 'ISS-FG-260714-005',
      idPallet: 'PALT-260714-005',
      closeType: 'Full Pallet',
      itemNo: '10000208888',
      itemName: 'FRONT PLATE',
      lotOqc: 'F67001',
      totalCloseBox: 5,
      totalCloseQty: 20000,
      closeBy: 'Store FG',
      boxes: [
        { id: 1, wosNo: 'JB615030K001', itemNo: '10000208888', itemName: 'FRONT PLATE', dieNo: 'F6', lotNo: 'L26118AA9', qty: 4000, boxStatus: 'Closed' },
        { id: 2, wosNo: 'JB615030K002', itemNo: '10000208888', itemName: 'FRONT PLATE', dieNo: 'F6', lotNo: 'L26118AA9', qty: 4000, boxStatus: 'Closed' },
      ],
    },
  ];

  get issuedLots(): IssuedPalletLot[] {
    return this.issuedLotsAll.filter((x) => this.passIssueFilter(x));
  }

  get closedLots(): ClosedPalletLot[] {
    return this.closedLotsAll.filter((x) => this.passCloseFilter(x));
  }

  get totalIssuedPallet(): number {
    return this.issuedLots.length;
  }

  get totalOpenPallet(): number {
    return this.issuedLots.filter((x) => x.status === 'Open').length;
  }

  get totalPartialPallet(): number {
    return this.issuedLots.filter((x) => x.status === 'Partial Closed').length;
  }

  get totalClosedPallet(): number {
    return this.closedLots.length;
  }

  get totalIssuedBox(): number {
    return this.issuedLots.reduce((sum, x) => sum + x.totalBox, 0);
  }

  get totalClosedBox(): number {
    return this.closedLots.reduce((sum, x) => sum + x.totalCloseBox, 0);
  }

  get currentPreview(): IssuedPalletLot | null {
    return this.selectedPreview || this.issuedLots[0] || null;
  }

  createDefaultFilters(): FilterState {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    return {
      dateFrom: this.toYmd(yesterday),
      dateTo: this.toYmd(today),
      itemKeyword: '',
      status: 'All',
      closeType: 'All',
    };
  }

  resetFilters() {
    this.filters = this.createDefaultFilters();
    this.selectedPreview = null;
  }

  toggleIssue(issueNo: string) {
    this.expandedIssue = this.expandedIssue === issueNo ? null : issueNo;
  }

  toggleClose(closeNo: string) {
    this.expandedClose = this.expandedClose === closeNo ? null : closeNo;
  }

  isIssueExpanded(issueNo: string): boolean {
    return this.expandedIssue === issueNo;
  }

  isCloseExpanded(closeNo: string): boolean {
    return this.expandedClose === closeNo;
  }

  selectPreview(lot: IssuedPalletLot) {
    this.selectedPreview = lot;
  }

  showIssueDetail(lot: IssuedPalletLot) {
    this.selectedPreview = lot;

    Swal.fire({
      title: 'Issued Pallet Detail',
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.8">
          <div><b>Issue No:</b> ${lot.issueNo}</div>
          <div><b>ID Pallet:</b> ${lot.idPallet}</div>
          <div><b>Item:</b> ${lot.itemNo} / ${lot.itemName}</div>
          <div><b>Lot OQC:</b> ${lot.lotOqc}</div>
          <div><b>Location:</b> ${lot.location}</div>
          <div><b>Box:</b> ${lot.closedBox}/${lot.totalBox}</div>
          <div><b>Status:</b> ${lot.status}</div>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#10b981',
    });
  }

  showCloseDetail(lot: ClosedPalletLot) {
    Swal.fire({
      title: 'Closed Pallet Detail',
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.8">
          <div><b>Close No:</b> ${lot.closeNo}</div>
          <div><b>Issue No:</b> ${lot.issueNo}</div>
          <div><b>ID Pallet:</b> ${lot.idPallet}</div>
          <div><b>Close Type:</b> ${lot.closeType}</div>
          <div><b>Item:</b> ${lot.itemNo} / ${lot.itemName}</div>
          <div><b>Close Box:</b> ${lot.totalCloseBox}</div>
          <div><b>Close Qty:</b> ${lot.totalCloseQty.toLocaleString()}</div>
        </div>
      `,
      icon: 'success',
      confirmButtonColor: '#14b8a6',
    });
  }

  private passIssueFilter(row: IssuedPalletLot): boolean {
    if (!this.passDate(row.issueDate)) return false;

    const kw = this.norm(this.filters.itemKeyword);
    if (kw) {
      const text = this.norm(`${row.issueNo} ${row.idPallet} ${row.itemNo} ${row.itemName} ${row.lotOqc}`);
      if (!text.includes(kw)) return false;
    }

    if (this.filters.status !== 'All' && row.status !== this.filters.status) {
      return false;
    }

    return true;
  }

  private passCloseFilter(row: ClosedPalletLot): boolean {
    if (!this.passDate(row.closeDate)) return false;

    const kw = this.norm(this.filters.itemKeyword);
    if (kw) {
      const text = this.norm(`${row.closeNo} ${row.issueNo} ${row.idPallet} ${row.itemNo} ${row.itemName} ${row.lotOqc}`);
      if (!text.includes(kw)) return false;
    }

    if (this.filters.closeType !== 'All' && row.closeType !== this.filters.closeType) {
      return false;
    }

    return true;
  }

  private passDate(dateStr: string): boolean {
    const d = new Date(`${dateStr}T00:00:00`);
    const from = new Date(`${this.filters.dateFrom}T00:00:00`);
    const to = new Date(`${this.filters.dateTo}T23:59:59`);
    return d >= from && d <= to;
  }

  private norm(v: string): string {
    return (v || '').trim().toUpperCase();
  }

  private toYmd(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}