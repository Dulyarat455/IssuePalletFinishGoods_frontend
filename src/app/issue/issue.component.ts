import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';
import config from '../../config';

/* =======================
   Types
======================= */

type GroupRow = {
  id: number;
  name: string;
};

type ItemMasterRow = {
  id: number;
  itemNo: string;
  itemName: string;
};

type ControlLotRow = {
  id: number;
  name: string;
  code?: string;
};

type LocationRow = {
  id: number;
  locationNo: string;
  name?: string;
};

type HeaderIssuePalletTemp = {
  id: number;
  issueDate: string;
  shift: string;
  groupId: number;
  groupName?: string;
  itemNo: string;
  itemName: string;
  controlLotId: number;
  controlLotName?: string;
  locationId: number;
  locationNo?: string;
  movementMonth: string;
  totalQtyBox: number;
  idPallet: string;
  userId: number;
  status: string;
};

type HeaderForm = {
  issueDate: string;
  shift: string;
  groupId: number | null;
  itemNo: string;
  itemName: string;
  controlLotId: number | null;
  locationId: number | null;
  movementMonth: string;
  totalQtyBox: number | null;
};

type WosScanForm = {
  itemNo: string;
  itemName: string;
  wosNo: string;
  dwg: string;
  dieNo: string;
  lotNo: string;
  qty: number | null;
};

type WosTempRow = {
  id: number;
  headerId: number;
  itemNo: string;
  itemName: string;
  wosNo: string;
  dwg: string;
  dieNo: string;
  lotNo: string;
  qty: number;
};

type FetchHeaderResp = {
  results: HeaderIssuePalletTemp | null;
};

type FetchWosTempResp = {
  results: WosTempRow[];
};

@Component({
  selector: 'app-issue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './issue.component.html',
  styleUrl: './issue.component.css',
})
export class IssueComponent implements OnInit, AfterViewInit {
  @ViewChild('scanItemNo') scanItemNo!: ElementRef<HTMLInputElement>;
  @ViewChild('scanItemName') scanItemName!: ElementRef<HTMLInputElement>;
  @ViewChild('scanWosNo') scanWosNo!: ElementRef<HTMLInputElement>;
  @ViewChild('scanDwg') scanDwg!: ElementRef<HTMLInputElement>;
  @ViewChild('scanDieNo') scanDieNo!: ElementRef<HTMLInputElement>;
  @ViewChild('scanLotNo') scanLotNo!: ElementRef<HTMLInputElement>;
  @ViewChild('scanQty') scanQty!: ElementRef<HTMLInputElement>;

  userId: number | null = null;

  header: HeaderIssuePalletTemp | null = null;
  form: HeaderForm = this.createEmptyHeaderForm();
  scanForm: WosScanForm = this.createEmptyScanForm();

  groups: GroupRow[] = [];
  items: ItemMasterRow[] = [];
  controlLots: ControlLotRow[] = [];
  locations: LocationRow[] = [];
  savedRows: WosTempRow[] = [];

  movementMonthOptions: string[] = [];

  itemKeyword = '';
  filteredItems: ItemMasterRow[] = [];
  showItemDrop = false;


  isLoadingHeader = false;
  isSavingHeader = false;
  isEditingHeader = false;
  isLoadingMaster = false;
  isSavingScan = false;
  isLoadingRows = false;
  isIssuing = false;
  isClearing = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.userId = Number(localStorage.getItem('finish_goods_userId')) || null;
  
    if (!this.userId) {
      Swal.fire('Error', 'ไม่พบ User ID กรุณา Login ใหม่', 'error');
      return;
    }
  
    this.generateMovementMonthOptions();
  
    this.fetchGroups();
    this.fetchItems();
    this.fetchControlLots();
    this.fetchLocations();
  
    this.fetchHeader();
  }

  ngAfterViewInit(): void {
    this.focusQr();
  }

  /* =======================
     Getter
  ======================= */

  get showHeaderForm(): boolean {
    return !this.header || this.isEditingHeader;
  }

  get totalScanQty(): number {
    return this.savedRows.reduce((sum, r) => sum + Number(r.qty || 0), 0);
  }

  get scanCount(): number {
    return this.savedRows.length;
  }

  get progressPercent(): number {
    if (!this.header?.totalQtyBox) return 0;
    return Math.min(100, Math.round((this.scanCount / this.header.totalQtyBox) * 100));
  }

  get isBoxFull(): boolean {
    if (!this.header) return false;
    return this.scanCount >= this.header.totalQtyBox;
  }

  get canIssue(): boolean {
    return !!this.header && !this.isEditingHeader && this.scanCount > 0;
  }

  /* =======================
     Create Empty
  ======================= */

  createEmptyHeaderForm(): HeaderForm {
    const d = new Date();
    const f = (n: number) => String(n).padStart(2, '0');

    return {
      issueDate: `${d.getFullYear()}-${f(d.getMonth() + 1)}-${f(d.getDate())}`,
      shift: '',
      groupId: null,
      itemNo: '',
      itemName: '',
      controlLotId: null,
      locationId: null,
      movementMonth: '',
      totalQtyBox: null,
    };
  }

  createEmptyScanForm(): WosScanForm {
    return {
      itemNo: '',
      itemName: '',
      wosNo: '',
      dwg: '',
      dieNo: '',
      lotNo: '',
      qty: null,
    };
  }

  /* =======================
     Helper
  ======================= */

  private focusEl(ref?: ElementRef<HTMLInputElement>) {
    setTimeout(() => {
      const el = ref?.nativeElement;
      if (!el) return;
  
      el.focus();
      el.select();
    }, 0);
  }
  
  private focusScanFirst() {
    if (!this.header || this.isEditingHeader) return;
    if (this.isBoxFull) return;
  
    this.focusEl(this.scanItemNo);
  }
  
  private focusQr() {
    this.focusScanFirst();
  }
  
  loopFocusToFirst(ev: any) {
    if (!this.header || this.isEditingHeader) return;
  
    if (ev?.key === 'Tab') ev.preventDefault();
    this.focusScanFirst();
  }

  private focusItemNo() {
    setTimeout(() => {
      this.scanItemNo?.nativeElement?.focus();
      this.scanItemNo?.nativeElement?.select();
    }, 120);
  }

  groupName(id?: number | null): string {
    if (!id) return '-';
    return this.groups.find((x) => x.id === id)?.name || '-';
  }

  controlLotName(id?: number | null): string {
    if (!id) return '-';
    return this.controlLots.find((x) => x.id === id)?.name || '-';
  }

  locationName(id?: number | null): string {
    if (!id) return '-';

    const loc = this.locations.find((x) => x.id === Number(id));
    if (!loc) return '-';

    return loc.name || loc.locationNo || '-';
  }


  private normalizeHeader(raw: any): HeaderIssuePalletTemp | null {
    if (!raw) return null;
  
    return {
      id: Number(raw.id),
  
      issueDate: raw.issueDate || raw.dateIssue,
      shift: raw.shift || '',
  
      groupId: Number(raw.groupId),
      groupName: raw.groupName,
  
      itemNo: raw.itemNo || '',
      itemName: raw.itemName || '',
  
      controlLotId: Number(raw.controlLotId),
      controlLotName: raw.controlLotName,
  
      locationId: Number(raw.locationId),
      locationNo: raw.locationNo,
  
      movementMonth: raw.movementMonth || raw.moveMentThreeMonth || '-',
  
      totalQtyBox: Number(raw.totalQtyBox ?? raw.totalBox ?? 0),
  
      // Temp ยังไม่ต้องมี ID Pallet จริง
      idPallet: raw.idPallet || 'Auto',
  
      userId: Number(raw.userId),
      status: raw.status || 'use',
    };
  }


  controlLotDisplayName(id?: number | null): string {
    if (!id) return '-';
  
    switch (Number(id)) {
      case 2:
        return 'Stator, HAL';
      case 3:
        return 'Front platate, General';
      case 4:
        return 'Part MA';
      case 5:
        return 'Part IM';
      case 6:
        return 'Part HB';
      default:
        return this.controlLotName(id);
    }
  }


  private mapHeaderToForm(h: HeaderIssuePalletTemp): HeaderForm {
    return {
      issueDate: this.toYmd(h.issueDate),
      shift: h.shift,
      groupId: h.groupId,
      itemNo: h.itemNo,
      itemName: h.itemName,
      controlLotId: h.controlLotId,
      locationId: h.locationId,
      movementMonth: h.movementMonth,
      totalQtyBox: h.totalQtyBox,
    };
  }

  private toYmd(v: string): string {
    const d = new Date(v);
    const f = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${f(d.getMonth() + 1)}-${f(d.getDate())}`;
  }

  private toast(icon: 'success' | 'warning' | 'error' | 'info', title: string) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true,
    });
  }



  private generateMovementMonthOptions() {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
  
    const now = new Date();
    const options: string[] = ['-'];
  
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
  
      options.push(`${month}-${year}`);
    }
  
    this.movementMonthOptions = options;
  }

    /* =======================
      Master Data
    ======================= */

    fetchGroups() {
      this.isLoadingMaster = true;

      this.http.get(config.apiServer + '/api/group/list').subscribe({
        next: (res: any) => {
          this.groups = (res.results || []).map((r: any) => ({
            id: r.id,
            name: r.name,
          }));

          this.checkMasterLoadingDone();
        },
        error: (err) => {
          console.error(err);
          this.checkMasterLoadingDone();

          Swal.fire({
            title: 'Error',
            text: err?.error?.message || err.message || 'Load group fail',
            icon: 'error',
          });
        },
      });
    }

    fetchItems() {
      this.isLoadingMaster = true;
    
      this.http.get(config.apiServer + '/api/partMaster/list').subscribe({
        next: (res: any) => {
          this.items = (res.results || []).map((r: any) => ({
            id: r.id,
            itemNo: r.itemNo,
            itemName: r.itemName,
          }));
    
          this.filteredItems = [...this.items];
    
          this.checkMasterLoadingDone();
        },
        error: (err) => {
          console.error(err);
          this.checkMasterLoadingDone();
    
          Swal.fire({
            title: 'Error',
            text: err?.error?.message || err.message || 'Load Part Master fail',
            icon: 'error',
          });
        },
      });
    }

    fetchControlLots() {
      this.isLoadingMaster = true;

      this.http.get(config.apiServer + '/api/controlLot/list').subscribe({
        next: (res: any) => {
          this.controlLots = (res.results || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            code: r.code,
          }));

          this.checkMasterLoadingDone();
        },
        error: (err) => {
          console.error(err);
          this.checkMasterLoadingDone();

          Swal.fire({
            title: 'Error',
            text: err?.error?.message || err.message || 'Load control lot fail',
            icon: 'error',
          });
        },
      });
    }

    fetchLocations() {
      this.isLoadingMaster = true;

      this.http.get(config.apiServer + '/api/location/list').subscribe({
        next: (res: any) => {
          this.locations = (res.results || []).map((r: any) => ({
            id: r.id,
            locationNo: r.locationNo || r.name,
            name: r.name,
          }));

          this.checkMasterLoadingDone();
        },
        error: (err) => {
          console.error(err);
          this.checkMasterLoadingDone();

          Swal.fire({
            title: 'Error',
            text: err?.error?.message || err.message || 'Load location fail',
            icon: 'error',
          });
        },
      });
    }

    private checkMasterLoadingDone() {
      this.isLoadingMaster = false;
    }



  /* =======================
     Item Search
  ======================= */

  filterItems() {
    const kw = (this.itemKeyword || '').trim().toLowerCase();

    this.filteredItems = !kw
      ? [...this.items]
      : this.items.filter(
          (x) =>
            (x.itemNo || '').toLowerCase().includes(kw) ||
            (x.itemName || '').toLowerCase().includes(kw)
        );
  }

  selectItem(it: ItemMasterRow) {
    this.itemKeyword = it.itemNo;
    this.form.itemNo = it.itemNo;
    this.form.itemName = it.itemName || '';
    this.showItemDrop = false;
  }

  onItemBlur() {
    setTimeout(() => {
      const kw = (this.itemKeyword || '').trim();
      const found = this.items.find((x) => x.itemNo === kw);

      if (!found) {
        this.itemKeyword = '';
        this.form.itemNo = '';
        this.form.itemName = '';
      } else {
        this.selectItem(found);
      }

      this.showItemDrop = false;
    }, 150);
  }

  /* =======================
     Header Temp
  ======================= */
  fetchHeader() {
    if (!this.userId) return;
  
    this.isLoadingHeader = true;
  
    this.http
      .post<any>(config.apiServer + '/api/issue/fetchHeaderTemp', {
        userId: this.userId,
      })
      .subscribe({
        next: (res: any) => {
          this.header = this.normalizeHeader(res.results);
  
          if (this.header) {
            this.form = this.mapHeaderToForm(this.header);
            this.itemKeyword = this.form.itemNo;
            this.isEditingHeader = false;
  
            // ถ้า API WOS Temp ยังไม่พร้อม ให้ comment บรรทัดนี้ไว้ก่อน
            // this.fetchWosTemp();
          } else {
            this.header = null;
            this.form = this.createEmptyHeaderForm();
            this.itemKeyword = '';
            this.savedRows = [];
            this.isEditingHeader = true;
          }
  
          this.isLoadingHeader = false;
          this.focusQr();
        },
        error: (err) => {
          console.error(err);
          this.isLoadingHeader = false;
  
          Swal.fire({
            title: 'Error',
            text: err?.error?.message || err.message || 'Load Header fail',
            icon: 'error',
          });
        },
      });
  }

  onSaveHeader() {
    if (!this.userId) return this.toast('warning', 'ไม่พบ User ID');
    if (!this.form.issueDate) return this.toast('warning', 'เลือก Date');
    if (!this.form.shift) return this.toast('warning', 'เลือก Shift');
    if (!this.form.groupId) return this.toast('warning', 'เลือก Group');
    if (!this.form.itemNo) return this.toast('warning', 'เลือก Item No.');
    if (!this.form.itemName) return this.toast('warning', 'ไม่พบ Item Name');
    if (!this.form.controlLotId) return this.toast('warning', 'เลือก Control Lot OQC');
    if (!this.form.locationId) return this.toast('warning', 'เลือก Location FG');
    if (!this.form.movementMonth) return this.toast('warning', 'เลือก Movement within 3 month');
  
    if (!this.form.totalQtyBox || this.form.totalQtyBox <= 0) {
      return this.toast('warning', 'กรอก Total QTY BOX');
    }
  
    if (this.form.totalQtyBox > 42) {
      return this.toast('warning', 'Total QTY BOX ห้ามเกิน 42 Box/ครั้ง');
    }
  
    this.isSavingHeader = true;
  
    const payload = {
      userId: Number(this.userId),
      dateIssue: new Date(this.form.issueDate).toISOString(),
      itemNo: this.form.itemNo,
      itemName: this.form.itemName,
      qtyBox: Number(this.form.totalQtyBox),
      shift: this.form.shift,
      groupId: Number(this.form.groupId),
      controlLotId: Number(this.form.controlLotId),
      locationId: Number(this.form.locationId),
      totalBox: Number(this.form.totalQtyBox),
      moveMentThreeMonth: this.form.movementMonth,
    };
  
    this.http
      .post<any>(config.apiServer + '/api/issue/createHeaderTemp', payload)
      .subscribe({
        next: (res) => {
          this.header = this.normalizeHeader(res.data);
  
          if (this.header) {
            this.form = this.mapHeaderToForm(this.header);
            this.itemKeyword = this.form.itemNo;
          }
  
          this.isEditingHeader = false;
          this.isSavingHeader = false;
  
          this.toast('success', 'Save Header Success');
  
          // ถ้า API WOS Temp ยังไม่พร้อม ให้ comment ไว้ก่อน
          // this.fetchWosTemp();
  
          this.focusQr();
        },
        error: (err) => {
          console.error(err);
          this.isSavingHeader = false;
  
          const msg = err?.error?.message || err.message || 'Save Header fail';
  
          if (msg === 'missing_required_fields') {
            Swal.fire('Warning', 'กรุณากรอกข้อมูล Header ให้ครบ', 'warning');
            return;
          }
  
          if (msg === 'invalid_dateIssue') {
            Swal.fire('Warning', 'รูปแบบ Date ไม่ถูกต้อง', 'warning');
            return;
          }
  
          Swal.fire('Error', msg, 'error');
        },
      });
  }

  onEditHeader() {
    if (!this.header) return;
    this.form = this.mapHeaderToForm(this.header);
    this.itemKeyword = this.form.itemNo;
    this.isEditingHeader = true;
  }

  onCancelEditHeader() {
    if (!this.header) return;
    this.form = this.mapHeaderToForm(this.header);
    this.itemKeyword = this.form.itemNo;
    this.isEditingHeader = false;
    this.focusQr();
  }

  onDeleteHeaderTemp() {
    if (!this.header) return;

    Swal.fire({
      title: 'Delete current pallet?',
      html: `
        <div style="text-align:left">
          <div><b>ID Pallet:</b> ${this.header.idPallet}</div>
          <div><b>Item:</b> ${this.header.itemNo} - ${this.header.itemName}</div>
          <div><b>Scanned:</b> ${this.scanCount} WOS</div>
          <div style="margin-top:8px;color:#b91c1c">
            Temp data ของ Pallet นี้จะถูกลบทั้งหมด
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then((r) => {
      if (!r.isConfirmed) return;

      this.isClearing = true;

      this.http
        .post<any>(config.apiServer + '/api/issuePallet/deleteHeaderTemp', {
          headerTempId: this.header!.id,
        })
        .subscribe({
          next: () => {
            this.isClearing = false;
            this.header = null;
            this.savedRows = [];
            this.scanForm = this.createEmptyScanForm();
            this.form = this.createEmptyHeaderForm();
            this.itemKeyword = '';
            this.isEditingHeader = true;
            this.toast('success', 'Delete Header Success');
          },
          error: (err) => {
            console.error(err);
            this.isClearing = false;
            Swal.fire('Error', err?.error?.message || 'Delete fail', 'error');
          },
        });
    });
  }

  /* =======================
     QR Scan
  ======================= */

  

  onScanEnter(
    field: 'itemNo' | 'itemName' | 'wosNo' | 'dwg' | 'dieNo' | 'lotNo' | 'qty',
    ev: any
  ) {
    if (ev?.key === 'Enter') ev.preventDefault();
  
    if (
      !this.header ||
      this.isEditingHeader ||
      this.isSavingScan ||
      this.isBoxFull
    ) {
      return;
    }
  
    const requiredOk =
      !!this.scanForm.itemNo &&
      !!this.scanForm.itemName &&
      !!this.scanForm.wosNo &&
      !!this.scanForm.dwg &&
      !!this.scanForm.dieNo &&
      !!this.scanForm.lotNo &&
      this.scanForm.qty != null &&
      this.scanForm.qty > 0;
  
    switch (field) {
      case 'itemNo':
        if (!this.scanForm.itemNo) return;
        return this.focusEl(this.scanItemName);
  
      case 'itemName':
        if (!this.scanForm.itemName) return;
        return this.focusEl(this.scanWosNo);
  
      case 'wosNo':
        if (!this.scanForm.wosNo) return;
        return this.focusEl(this.scanDwg);
  
      case 'dwg':
        if (!this.scanForm.dwg) return;
        return this.focusEl(this.scanDieNo);
  
      case 'dieNo':
        if (!this.scanForm.dieNo) return;
        return this.focusEl(this.scanLotNo);
  
      case 'lotNo':
        if (!this.scanForm.lotNo) return;
        return this.focusEl(this.scanQty);
  
      case 'qty':
        if (!requiredOk) return;
        return this.onConfirmScan();
    }
  }

  onConfirmScan() {
    if (!this.header || this.isEditingHeader) {
      return this.toast('warning', 'กรุณาบันทึก Header ให้เสร็จก่อน');
    }
  
    if (this.isBoxFull) {
      return this.toast('info', 'ครบจำนวน BOX แล้ว');
    }
  
    this.scanForm.itemNo = (this.scanForm.itemNo || '').trim();
    this.scanForm.itemName = (this.scanForm.itemName || '').trim();
    this.scanForm.wosNo = (this.scanForm.wosNo || '').trim();
    this.scanForm.dwg = (this.scanForm.dwg || '').trim();
    this.scanForm.dieNo = (this.scanForm.dieNo || '').trim();
    this.scanForm.lotNo = (this.scanForm.lotNo || '').trim();
  
    if (!this.scanForm.itemNo) return this.toast('warning', 'กรุณากรอก Item No.');
    if (!this.scanForm.itemName) return this.toast('warning', 'กรุณากรอก Item Name');
    if (!this.scanForm.wosNo) return this.toast('warning', 'กรุณากรอก WOS No.');
    if (!this.scanForm.dwg) return this.toast('warning', 'กรุณากรอก DWG');
    if (!this.scanForm.dieNo) return this.toast('warning', 'กรุณากรอก Die No.');
    if (!this.scanForm.lotNo) return this.toast('warning', 'กรุณากรอก Lot No.');
  
    if (this.scanForm.qty == null || this.scanForm.qty <= 0) {
      return this.toast('warning', 'กรุณากรอก QTY');
    }
  
    this.isSavingScan = true;
  
    const payload = {
      headTempId: this.header.id,
      itemNo: this.scanForm.itemNo,
      itemName: this.scanForm.itemName,
      wosNo: this.scanForm.wosNo,
      dwg: this.scanForm.dwg,
      dieNo: this.scanForm.dieNo,
      lotNo: this.scanForm.lotNo,
      qty: this.scanForm.qty,
    };
  
    this.http
      .post<any>(config.apiServer + '/api/issue/createBoxTemp', payload)
      .subscribe({
        next: (res: any) => {
          const row = res.data;
  
          this.savedRows = [
            ...this.savedRows,
            {
              id: row.id,
              headerId: row.headerId,
              itemNo: row.itemNo,
              itemName: row.itemName,
              wosNo: row.wosNo,
              dwg: row.dwg,
              dieNo: row.dieNo,
              lotNo: row.lotNo,
              qty: Number(row.qty || 0),
            },
          ];
  
          this.toast('success', 'Scan สำเร็จ');
  
          this.scanForm = this.createEmptyScanForm();
          this.isSavingScan = false;
          this.focusScanFirst();
        },
        error: (err) => {
          console.error(err);
          this.isSavingScan = false;
  
          Swal.fire({
            title: 'Error',
            text: err?.error?.message || err?.message || 'Confirm Scan ไม่สำเร็จ',
            icon: 'error',
          }).then(() => {
            this.scanForm = this.createEmptyScanForm();
            this.focusScanFirst();
          });
        },
      });
  }

  clearScanForm() {
    this.scanForm = this.createEmptyScanForm();
    this.focusScanFirst();
  }

  /* =======================
     WOS Temp List
  ======================= */

  fetchWosTemp() {
    if (!this.header) {
      this.savedRows = [];
      return;
    }

    this.isLoadingRows = true;

    this.http
      .post<FetchWosTempResp>(config.apiServer + '/api/issuePallet/fetchWosTempByHeader', {
        headerTempId: this.header.id,
      })
      .subscribe({
        next: (res) => {
          this.savedRows = res.results || [];
          this.isLoadingRows = false;
          this.focusQr();
        },
        error: (err) => {
          console.error(err);
          this.savedRows = [];
          this.isLoadingRows = false;
          Swal.fire('Error', err?.error?.message || 'Load WOS fail', 'error');
        },
      });
  }

  onDeleteRow(row: WosTempRow) {
    Swal.fire({
      title: 'Delete WOS?',
      html: `
        <div style="text-align:left">
          <div><b>WOS:</b> ${row.wosNo}</div>
          <div><b>Lot:</b> ${row.lotNo}</div>
          <div><b>QTY:</b> ${row.qty}</div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
    }).then((r) => {
      if (!r.isConfirmed) return;

      this.http
        .post<any>(config.apiServer + '/api/issuePallet/deleteWosTemp', {
          wosTempId: row.id,
        })
        .subscribe({
          next: () => {
            this.toast('success', 'Delete Success');
            this.fetchWosTemp();
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', err?.error?.message || 'Delete fail', 'error');
          },
        });
    });
  }

  onClearAllScan() {
    if (!this.header || this.savedRows.length === 0) return;

    Swal.fire({
      title: 'Clear All Scan?',
      text: `ต้องการลบรายการ Scan ทั้งหมด ${this.savedRows.length} รายการใช่ไหม`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Clear',
      confirmButtonColor: '#dc2626',
    }).then((r) => {
      if (!r.isConfirmed) return;

      this.isClearing = true;

      this.http
        .post<any>(config.apiServer + '/api/issuePallet/deleteWosTempAll', {
          headerTempId: this.header!.id,
        })
        .subscribe({
          next: () => {
            this.isClearing = false;
            this.savedRows = [];
            this.toast('success', 'Clear Success');
            this.focusQr();
          },
          error: (err) => {
            console.error(err);
            this.isClearing = false;
            Swal.fire('Error', err?.error?.message || 'Clear fail', 'error');
          },
        });
    });
  }

  /* =======================
     Issue / Print Label
  ======================= */

  onIssuePallet() {
    if (!this.header) return this.toast('warning', 'ไม่พบ Header');
    if (this.savedRows.length === 0) return this.toast('warning', 'ยังไม่มีรายการ Scan');

    Swal.fire({
      title: 'Confirm Issue Pallet?',
      html: `
        <div style="text-align:left">
          <div><b>ID Pallet:</b> ${this.header.idPallet}</div>
          <div><b>Item:</b> ${this.header.itemNo} - ${this.header.itemName}</div>
          <div><b>Location:</b> ${this.locationName(this.header.locationId)}</div>
          <div><b>Total WOS:</b> ${this.savedRows.length}</div>
          <div><b>Total QTY:</b> ${this.totalScanQty.toLocaleString()}</div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Issue & Print Label',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#16a34a',
    }).then((r) => {
      if (!r.isConfirmed) return;

      this.isIssuing = true;

      Swal.fire({
        title: 'Issuing...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      this.http
        .post<any>(config.apiServer + '/api/issuePallet/createIssuePallet', {
          userId: this.userId,
          headerTempId: this.header!.id,
        })
        .subscribe({
          next: (res) => {
            Swal.close();
            this.isIssuing = false;

            Swal.fire({
              icon: 'success',
              title: 'Issue Success',
              text: 'สร้าง Pallet Label สำเร็จ',
              confirmButtonText: 'OK',
            }).then(() => {
              if (res?.pdfUrl) {
                window.open(config.apiServer + res.pdfUrl, '_blank');
              }

              this.header = null;
              this.savedRows = [];
              this.scanForm = this.createEmptyScanForm();
              this.form = this.createEmptyHeaderForm();
              this.itemKeyword = '';
              this.isEditingHeader = true;
              this.fetchHeader();
            });
          },
          error: (err) => {
            console.error(err);
            this.isIssuing = false;
            Swal.fire('Error', err?.error?.message || 'Issue fail', 'error');
          },
        });
    });
  }
}