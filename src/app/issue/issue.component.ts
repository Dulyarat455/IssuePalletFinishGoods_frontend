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

  editQty?: number | null;
  isUpdatingQty?: boolean;
};



type HeaderTempFraction = {
  id: number;
  headerId: number;
  qtyBox: number;
  timeStmp?: string;
  status: string;
};



type FractionTempRow = WosTempRow & {
  mapId?: number;
  headerFractionId?: number;
  boxId?: number;

  editQty?: number | null;
  isUpdatingQty?: boolean;
};



type FractionTempListResp = {
  message?: string;
  headerFraction: HeaderTempFraction | null;
  results: FractionTempRow[];
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


  @ViewChild('fractionItemNo') fractionItemNo!: ElementRef<HTMLInputElement>;
  @ViewChild('fractionItemName') fractionItemName!: ElementRef<HTMLInputElement>;
  @ViewChild('fractionWosNo') fractionWosNo!: ElementRef<HTMLInputElement>;
  @ViewChild('fractionDwg') fractionDwg!: ElementRef<HTMLInputElement>;
  @ViewChild('fractionDieNo') fractionDieNo!: ElementRef<HTMLInputElement>;
  @ViewChild('fractionLotNo') fractionLotNo!: ElementRef<HTMLInputElement>;
  @ViewChild('fractionQty') fractionQty!: ElementRef<HTMLInputElement>;

  userId: number | null = null;

  header: HeaderIssuePalletTemp | null = null;
  form: HeaderForm = this.createEmptyHeaderForm();
  scanForm: WosScanForm = this.createEmptyScanForm();

  groups: GroupRow[] = [];
  items: ItemMasterRow[] = [];
  controlLots: ControlLotRow[] = [];
  locations: LocationRow[] = [];
  savedRows: WosTempRow[] = [];


  showFractionSection = false;

  fractionHeader: HeaderTempFraction | null = null;
  fractionQtyBox: number | null = null;

  fractionScanForm: WosScanForm = this.createEmptyScanForm();
  fractionRows: FractionTempRow[] = [];

  isSavingFractionHeader = false;
  isSavingFractionScan = false;
  isLoadingFractionRows = false;


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

  isDeletingBox = false;
  isDeletingHeader = false;

  isDeletingFractionHeader = false;
  isClearingFractionBoxes = false;


  isDeletingFractionBox = false;

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


  get fractionScanCount(): number {
    return this.fractionRows.length;
  }
  
  get isFractionFull(): boolean {
    if (!this.fractionHeader) return false;
  
    return this.fractionScanCount >= Number(this.fractionHeader.qtyBox || 0);
  }
  
  get fractionTotalQty(): number {
    return this.fractionRows.reduce((sum, row) => {
      return sum + Number(row.qty || 0);
    }, 0);
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


  private focusFractionFirst() {
    if (!this.header || this.isEditingHeader) return;
    if (!this.showFractionSection) return;
    if (!this.fractionHeader) return;
    if (this.isFractionFull) return;
  
    this.focusEl(this.fractionItemNo);
  }
  
  loopFractionFocusToFirst(ev: any) {
    if (ev?.key === 'Tab') {
      ev.preventDefault();
    }
  
    this.focusFractionFirst();
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
  
            // โหลดรายการ Box Temp ของ Header นี้
            this.fetchWosTemp();
            this.fetchFractionTempList();
          } else {
            this.header = null;
            this.form = this.createEmptyHeaderForm();
            this.itemKeyword = '';
            this.savedRows = [];
            this.isEditingHeader = true;
            this.showFractionSection = false;
            this.fractionHeader = null;
            this.fractionQtyBox = null;
            this.fractionRows = [];
            this.fractionScanForm = this.createEmptyScanForm();
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
  
  
    if (
      this.header &&
      this.isEditingHeader &&
      this.scanCount > Number(this.form.totalQtyBox)
    ) {
      return Swal.fire({
        icon: 'warning',
        title: 'Total QTY BOX น้อยกว่าจำนวนที่ Scan แล้ว',
        text:
          `ตอนนี้ Scan แล้ว ${this.scanCount} Box ` +
          `ไม่สามารถแก้ Total QTY BOX เป็น ${this.form.totalQtyBox} ได้`,
      });
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
  
    const isEditMode = !!this.header && this.isEditingHeader;
  
    const url = isEditMode
      ? config.apiServer + '/api/issue/editHeaderTemp'
      : config.apiServer + '/api/issue/createHeaderTemp';
  
    const finalPayload = isEditMode
      ? {
          ...payload,
          headTempId: this.header!.id,
        }
      : payload;
  
    this.http.post<any>(url, finalPayload).subscribe({
      next: (res) => {
        this.header = this.normalizeHeader(res.data);
  
        if (this.header) {
          this.form = this.mapHeaderToForm(this.header);
          this.itemKeyword = this.form.itemNo;
        }
  
        this.isEditingHeader = false;
        this.isSavingHeader = false;
  
        this.toast(
          'success',
          isEditMode ? 'Edit Header Success' : 'Save Header Success'
        );
  
        this.fetchWosTemp();
        this.fetchFractionTempList();
  
        this.focusQr();
      },
      error: (err) => {
        console.error(err);
        this.isSavingHeader = false;
  
        const msg =
          err?.error?.message ||
          err?.error?.error ||
          err.message ||
          'Save Header fail';
  
        if (msg === 'missing_required_fields') {
          Swal.fire('Warning', 'กรุณากรอกข้อมูล Header ให้ครบ', 'warning');
          return;
        }
  
        if (msg === 'invalid_dateIssue') {
          Swal.fire('Warning', 'รูปแบบ Date ไม่ถูกต้อง', 'warning');
          return;
        }
  
        if (msg === 'header_issueTemp_notFound') {
          Swal.fire('Warning', 'ไม่พบ Header Temp นี้ในระบบ', 'warning');
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
      title: 'Delete current Header?',
      html: `
        <div style="text-align:left">
          <div><b>ID Pallet:</b> ${this.header.idPallet}</div>
          <div><b>Item:</b> ${this.header.itemNo} - ${this.header.itemName}</div>
          <div><b>Normal Box:</b> ${this.scanCount}</div>
          <div><b>Fraction Box:</b> ${this.fractionScanCount}</div>
  
          <div style="margin-top:10px;color:#b91c1c;font-weight:700">
            จะลบ Header นี้ พร้อม Box ปกติ, Header Box เศษ และ Box เศษทั้งหมด
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete All',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then((r) => {
      if (!r.isConfirmed) return;
  
      this.isDeletingHeader = true;
  
      this.http
        .post<any>(config.apiServer + '/api/issue/deleteheaderTemp', {
          headerTempId: this.header!.id,
        })
        .subscribe({
          next: () => {
            this.isDeletingHeader = false;
  
            this.header = null;
            this.form = this.createEmptyHeaderForm();
            this.itemKeyword = '';
  
            this.savedRows = [];
            this.scanForm = this.createEmptyScanForm();
  
            this.showFractionSection = false;
            this.fractionHeader = null;
            this.fractionQtyBox = null;
            this.fractionRows = [];
            this.fractionScanForm = this.createEmptyScanForm();
  
            this.isEditingHeader = true;
  
            this.toast('success', 'Delete Header Success');
            this.focusQr();
          },
          error: (err) => {
            console.error(err);
            this.isDeletingHeader = false;
  
            Swal.fire(
              'Error',
              err?.error?.message ||
                err?.error?.error ||
                err?.message ||
                'Delete Header fail',
              'error'
            );
          },
        });
    });
  }


  onDeleteFractionHeaderTemp() {
    if (!this.fractionHeader) {
      return this.toast('warning', 'ยังไม่มี Header Box เศษ');
    }
  
    Swal.fire({
      title: 'Delete Header Box เศษ?',
      html: `
        <div style="text-align:left">
          <div><b>Header Fraction ID:</b> ${this.fractionHeader.id}</div>
          <div><b>QTY BOX เศษ:</b> ${this.fractionHeader.qtyBox}</div>
          <div><b>Scanned Box เศษ:</b> ${this.fractionScanCount}</div>
  
          <div style="margin-top:10px;color:#b91c1c;font-weight:700">
            จะลบ Header Box เศษนี้ และ Box เศษทั้งหมดที่อยู่ภายใน
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete Header เศษ',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then((r) => {
      if (!r.isConfirmed) return;
  
      this.isDeletingFractionHeader = true;
  
      this.http
        .post<any>(config.apiServer + '/api/issue/deleteheaderFractionTemp', {
          headerFractionTempId: this.fractionHeader!.id,
        })
        .subscribe({
          next: () => {
            this.isDeletingFractionHeader = false;
  
            this.fractionHeader = null;
            this.fractionQtyBox = null;
            this.fractionRows = [];
            this.fractionScanForm = this.createEmptyScanForm();
  
            this.toast('success', 'Delete Header Box เศษ Success');
  
            this.fetchWosTemp();
          },
          error: (err) => {
            console.error(err);
            this.isDeletingFractionHeader = false;
  
            Swal.fire(
              'Error',
              err?.error?.message ||
                err?.error?.error ||
                err?.message ||
                'Delete Header Fraction fail',
              'error'
            );
          },
        });
    });
  }


  onClearAllFractionBoxTemp() {
    if (!this.fractionHeader || this.fractionRows.length === 0) return;
  
    Swal.fire({
      title: 'Clear All Box เศษ?',
      html: `
        <div style="text-align:left">
          <div>ต้องการลบ Box เศษทั้งหมด <b>${this.fractionRows.length}</b> รายการใช่ไหม</div>
          <div style="margin-top:8px;color:#64748b">
            Header Box เศษจะยังอยู่ แต่รายการ Box เศษทั้งหมดจะถูกลบ
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Clear All Box เศษ',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then((r) => {
      if (!r.isConfirmed) return;
  
      this.isClearingFractionBoxes = true;
  
      this.http
        .post<any>(config.apiServer + '/api/issue/deleteAllFractionBoxTemp', {
          headerFractionId: this.fractionHeader!.id,
        })
        .subscribe({
          next: () => {
            this.isClearingFractionBoxes = false;
  
            this.fractionRows = [];
            this.fractionScanForm = this.createEmptyScanForm();
  
            this.toast('success', 'Clear Box เศษ Success');
  
            this.fetchFractionTempList();
            this.fetchWosTemp();
            this.focusFractionFirst();
          },
          error: (err) => {
            console.error(err);
            this.isClearingFractionBoxes = false;
  
            Swal.fire(
              'Error',
              err?.error?.message ||
                err?.error?.error ||
                err?.message ||
                'Clear Fraction Box fail',
              'error'
            );
          },
        });
    });
  }


  onDeleteFractionBoxTemp(row: FractionTempRow) {
    if (!row) return;
  
    const boxId = Number(row.boxId || row.id);
  
    if (!boxId) {
      return this.toast('warning', 'ไม่พบ Box ID');
    }
  
    Swal.fire({
      title: 'Delete Box เศษ?',
      html: `
        <div style="text-align:left">
          <div><b>WOS:</b> ${row.wosNo || '-'}</div>
          <div><b>Lot:</b> ${row.lotNo || '-'}</div>
          <div><b>Die:</b> ${row.dieNo || '-'}</div>
          <div><b>QTY:</b> ${row.qty || 0}</div>
  
          <div style="margin-top:10px;color:#b91c1c;font-weight:700">
            รายการ Box เศษนี้จะถูกลบออกจากระบบ
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
  
      this.isDeletingFractionBox = true;
  
      this.http
        .post<any>(config.apiServer + '/api/issue/deleteFractionBoxTemp', {
          boxId,
        })
        .subscribe({
          next: () => {
            this.isDeletingFractionBox = false;
  
            this.toast('success', 'Delete Box เศษ Success');
  
            this.fetchFractionTempList();
            this.fetchWosTemp();
            this.focusFractionFirst();
          },
          error: (err) => {
            console.error(err);
            this.isDeletingFractionBox = false;
  
            Swal.fire(
              'Error',
              err?.error?.message ||
                err?.error?.error ||
                err?.message ||
                'Delete Box เศษ fail',
              'error'
            );
          },
        });
    });
  }



  fetchFractionTempList() {
    if (!this.header) {
      this.fractionHeader = null;
      this.fractionQtyBox = null;
      this.fractionRows = [];
      this.isLoadingFractionRows = false;
      return;
    }
  
    this.isLoadingFractionRows = true;
  
    this.http
      .post<FractionTempListResp>(
        config.apiServer + '/api/issue/fractionTempListByHeaderTempId',
        {
          headTempId: this.header.id,
        }
      )
      .subscribe({
        next: (res) => {
          this.fractionHeader = res.headerFraction || null;
          this.fractionRows = (res.results || []).map((row) => ({
            ...row,
            editQty: Number(row.qty || 0),
            isUpdatingQty: false,
          }));
  
          if (this.fractionHeader) {
            this.fractionQtyBox = Number(this.fractionHeader.qtyBox);
            this.showFractionSection = true;
          } else {
            this.fractionQtyBox = null;
            this.fractionRows = [];
          }
  
          this.isLoadingFractionRows = false;
        },
        error: (err) => {
          console.error(err);
  
          this.fractionHeader = null;
          this.fractionQtyBox = null;
          this.fractionRows = [];
          this.isLoadingFractionRows = false;
        },
      });
  }


  toggleFractionSection() {
    if (!this.header || this.isEditingHeader) {
      return this.toast('warning', 'กรุณาบันทึก Header หลักก่อน');
    }
  
    this.showFractionSection = !this.showFractionSection;
  
    if (this.showFractionSection && this.fractionHeader) {
      setTimeout(() => {
        this.focusFractionFirst();
      }, 150);
    }
  }



  onSaveFractionHeader() {
    if (!this.header || this.isEditingHeader) {
      return this.toast('warning', 'กรุณาบันทึก Header หลักก่อน');
    }
  
    if (this.fractionQtyBox == null || Number(this.fractionQtyBox) <= 0) {
      return this.toast('warning', 'กรุณากรอก QTY BOX เศษ');
    }
  
    if (Number(this.fractionQtyBox) > 42) {
      return this.toast('warning', 'QTY BOX เศษห้ามเกิน 42 Box');
    }
  
    if (
      this.fractionHeader &&
      this.fractionScanCount > Number(this.fractionQtyBox)
    ) {
      return Swal.fire({
        icon: 'warning',
        title: 'QTY BOX เศษน้อยกว่าจำนวนที่ Scan แล้ว',
        text:
          `ตอนนี้ Scan แล้ว ${this.fractionScanCount} Box ` +
          `จึงไม่สามารถแก้เป็น ${this.fractionQtyBox} Box ได้`,
      });
    }
  
    const isEditMode = !!this.fractionHeader;
  
    this.isSavingFractionHeader = true;
  
    const url = isEditMode
      ? config.apiServer + '/api/issue/editFractionTemp'
      : config.apiServer + '/api/issue/createHeaderTempFraction';
  
    const payload = isEditMode
      ? {
          headFractionTempId: this.fractionHeader!.id,
          headTempId: this.header.id,
          qtyBox: Number(this.fractionQtyBox),
        }
      : {
          headTempId: this.header.id,
          qtyBox: Number(this.fractionQtyBox),
        };
  
    this.http.post<any>(url, payload).subscribe({
      next: (res) => {
        this.fractionHeader = {
          id: Number(res.data.id),
          headerId: Number(res.data.headerId ?? this.header!.id),
          qtyBox: Number(res.data.qtyBox),
          timeStmp: res.data.timeStmp,
          status: res.data.status || 'use',
        };
  
        this.fractionQtyBox = this.fractionHeader.qtyBox;
        this.isSavingFractionHeader = false;
  
        this.toast(
          'success',
          isEditMode
            ? 'แก้ไข Header Box เศษสำเร็จ'
            : 'สร้าง Header Box เศษสำเร็จ'
        );
  
        this.fetchFractionTempList();
  
        setTimeout(() => {
          this.focusFractionFirst();
        }, 150);
      },
      error: (err) => {
        console.error(err);
        this.isSavingFractionHeader = false;
  
        const msg =
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Save Header Fraction fail';
  
        if (msg === 'qtyBox_less_than_scanned_box') {
          Swal.fire(
            'Warning',
            'QTY BOX เศษน้อยกว่าจำนวน Box ที่ Scan แล้ว',
            'warning'
          );
          return;
        }
  
        if (msg === 'header_issueTemp_fraction_notFound') {
          Swal.fire(
            'Warning',
            'ไม่พบ Header Box เศษนี้ในระบบ',
            'warning'
          );
          return;
        }
  
        Swal.fire({
          icon: 'error',
          title: isEditMode
            ? 'แก้ไข Header Box เศษไม่สำเร็จ'
            : 'สร้าง Header Box เศษไม่สำเร็จ',
          text: msg,
        });
      },
    });
  }




  onUpdateFractionBoxQty(row: FractionTempRow) {
    if (!this.header || !this.fractionHeader) {
      return this.toast('warning', 'ไม่พบ Header Box เศษ');
    }
  
    const boxTempId = Number(row.boxId || row.id);
    const qty = Number(row.editQty);
  
    if (!boxTempId) {
      return this.toast('warning', 'ไม่พบ Box Temp ID');
    }
  
    if (!Number.isFinite(qty) || qty <= 0) {
      row.editQty = row.qty;
  
      return Swal.fire({
        icon: 'warning',
        title: 'QTY ไม่ถูกต้อง',
        text: 'กรุณากรอก QTY มากกว่า 0',
      });
    }
  
    if (qty === Number(row.qty)) {
      return this.toast('info', 'QTY ไม่มีการเปลี่ยนแปลง');
    }
  
    row.isUpdatingQty = true;
  
    this.http
      .post<any>(
        config.apiServer + '/api/issue/editFractionBoxTemp',
        {
          headFractionTempId: this.fractionHeader.id,
          headTempId: this.header.id,
          boxTempId,
          qty,
        }
      )
      .subscribe({
        next: (res) => {
          row.qty = Number(res.data.qty);
          row.editQty = Number(res.data.qty);
          row.isUpdatingQty = false;
  
          this.toast('success', 'แก้ไข QTY Box เศษสำเร็จ');
        },
        error: (err) => {
          console.error(err);
  
          row.editQty = row.qty;
          row.isUpdatingQty = false;
  
          const msg =
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Update Fraction Box Qty fail';
  
          if (msg === 'map_header_issueFractionTemp_notFound') {
            Swal.fire(
              'Warning',
              'ไม่พบข้อมูล Map ของ Box เศษนี้',
              'warning'
            );
            return;
          }
  
          if (msg === 'box_issueTemp_notFound') {
            Swal.fire(
              'Warning',
              'ไม่พบ Box เศษนี้ในระบบ',
              'warning'
            );
            return;
          }
  
          Swal.fire({
            icon: 'error',
            title: 'แก้ไข QTY Box เศษไม่สำเร็จ',
            text: msg,
          });
        },
      });
  }

  resetFractionBoxQty(row: FractionTempRow) {
    row.editQty = row.qty;
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


  onFractionScanEnter(
    field: 'itemNo' | 'itemName' | 'wosNo' | 'dwg' | 'dieNo' | 'lotNo' | 'qty',
    ev: any
  ) {
    if (ev?.key === 'Enter') {
      ev.preventDefault();
    }
  
    if (
      !this.header ||
      this.isEditingHeader ||
      !this.fractionHeader ||
      this.isSavingFractionScan ||
      this.isFractionFull
    ) {
      return;
    }
  
    const requiredOk =
      !!this.fractionScanForm.itemNo &&
      !!this.fractionScanForm.itemName &&
      !!this.fractionScanForm.wosNo &&
      !!this.fractionScanForm.dwg &&
      !!this.fractionScanForm.dieNo &&
      !!this.fractionScanForm.lotNo &&
      this.fractionScanForm.qty != null &&
      Number(this.fractionScanForm.qty) > 0;
  
    switch (field) {
      case 'itemNo':
        if (!this.fractionScanForm.itemNo) return;
        return this.focusEl(this.fractionItemName);
  
      case 'itemName':
        if (!this.fractionScanForm.itemName) return;
        return this.focusEl(this.fractionWosNo);
  
      case 'wosNo':
        if (!this.fractionScanForm.wosNo) return;
        return this.focusEl(this.fractionDwg);
  
      case 'dwg':
        if (!this.fractionScanForm.dwg) return;
        return this.focusEl(this.fractionDieNo);
  
      case 'dieNo':
        if (!this.fractionScanForm.dieNo) return;
        return this.focusEl(this.fractionLotNo);
  
      case 'lotNo':
        if (!this.fractionScanForm.lotNo) return;
        return this.focusEl(this.fractionQty);
  
      case 'qty':
        if (!requiredOk) return;
        return this.onConfirmFractionScan();
    }
  }


  onConfirmFractionScan() {
    if (!this.header || this.isEditingHeader) {
      return this.toast('warning', 'กรุณาบันทึก Header หลักก่อน');
    }
  
    if (!this.fractionHeader) {
      return this.toast('warning', 'กรุณาสร้าง Header Box เศษก่อน');
    }
  
    if (this.isFractionFull) {
      return this.toast('info', 'จำนวน Box เศษครบแล้ว');
    }
  
    const data = {
      itemNo: String(this.fractionScanForm.itemNo || '').trim(),
      itemName: String(this.fractionScanForm.itemName || '').trim(),
      wosNo: String(this.fractionScanForm.wosNo || '').trim(),
      dwg: String(this.fractionScanForm.dwg || '').trim(),
      dieNo: String(this.fractionScanForm.dieNo || '').trim(),
      lotNo: String(this.fractionScanForm.lotNo || '').trim(),
      qty: Number(this.fractionScanForm.qty),
    };
  
    if (!data.itemNo) return this.toast('warning', 'กรุณากรอก Item No.');
    if (!data.itemName) return this.toast('warning', 'กรุณากรอก Item Name');
    if (!data.wosNo) return this.toast('warning', 'กรุณากรอก WOS No.');
    if (!data.dwg) return this.toast('warning', 'กรุณากรอก DWG');
    if (!data.dieNo) return this.toast('warning', 'กรุณากรอก Die No.');
    if (!data.lotNo) return this.toast('warning', 'กรุณากรอก Lot No.');
  
    if (!Number.isFinite(data.qty) || data.qty <= 0) {
      return this.toast('warning', 'กรุณากรอก QTY');
    }
  
    const headerItemNo = String(this.header.itemNo || '').trim();
  
    if (data.itemNo !== headerItemNo) {
      document.activeElement instanceof HTMLElement &&
        document.activeElement.blur();
  
      return Swal.fire({
        icon: 'warning',
        title: 'Item No. ของ Box เศษไม่ตรงกับ Header',
        html: `
          <div style="text-align:left">
            <div><b>Item No. จาก Header:</b> ${headerItemNo}</div>
            <div><b>Item No. ที่ Scan:</b> ${data.itemNo}</div>
  
            <div style="margin-top:10px;color:#b91c1c">
              Box เศษที่ Scan ไม่ใช่ Item No. เดียวกับ Header หลัก
            </div>
  
            <div style="margin-top:6px;color:#64748b">
              กรุณาตรวจสอบชิ้นงาน และเริ่ม Scan ใหม่อีกครั้ง
            </div>
          </div>
        `,
        confirmButtonText: 'Scan ใหม่',
        confirmButtonColor: '#dc2626',
        returnFocus: false,
        focusConfirm: true,
      }).then(() => {
        this.fractionScanForm = this.createEmptyScanForm();
  
        setTimeout(() => {
          this.focusFractionFirst();
        }, 150);
      });
    }
  
    this.isSavingFractionScan = true;
  
    this.http
      .post<any>(
        config.apiServer + '/api/issue/mapFractionTemp',
        {
          headTempId: this.header.id,
          headFractionId: this.fractionHeader.id,
          itemNo: data.itemNo,
          itemName: data.itemName,
          wosNo: data.wosNo,
          dwg: data.dwg,
          dieNo: data.dieNo,
          lotNo: data.lotNo,
          qty: data.qty,
        }
      )
      .subscribe({
        next: (res) => {
          this.fractionScanForm = this.createEmptyScanForm();
          this.isSavingFractionScan = false;

          this.toast('success', 'Scan Box เศษสำเร็จ');

          // ดึงรายการ Box เศษจาก backend ใหม่
          this.fetchFractionTempList();

          setTimeout(() => {
            this.focusFractionFirst();
          }, 150);
        },
        error: (err) => {
          console.error(err);
          this.isSavingFractionScan = false;
  
          Swal.fire({
            icon: 'error',
            title: 'Scan Box เศษไม่สำเร็จ',
            text:
              err?.error?.message ||
              err?.error?.error ||
              err?.message ||
              'Map Fraction Temp fail',
          }).then(() => {
            this.fractionScanForm = this.createEmptyScanForm();
            this.focusFractionFirst();
          });
        },
      });
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
  
    // เช็ค Item No. ที่ scan ว่าตรงกับ Header ไหม ก่อนส่ง backend
    const headerItemNo = String(this.header.itemNo || '').trim();
    const scanItemNo = String(this.scanForm.itemNo || '').trim();
  
    if (scanItemNo !== headerItemNo) {
      document.activeElement instanceof HTMLElement && document.activeElement.blur();
    
      return Swal.fire({
        icon: 'warning',
        title: 'Item No. ไม่ตรงกับ Header',
        html: `
          <div style="text-align:left">
            <div><b>Item No. จาก Header:</b> ${headerItemNo}</div>
            <div><b>Item No. ที่ Scan:</b> ${scanItemNo}</div>
    
            <div style="margin-top:10px;color:#b91c1c">
              ข้อมูลที่สแกนเข้ามาไม่ใช่ Item No. เดียวกับ Header ที่เปิดอยู่
            </div>
    
            <div style="margin-top:6px;color:#64748b">
              กรุณาตรวจสอบชิ้นงาน หรือเริ่ม Scan ใหม่อีกครั้ง
            </div>
          </div>
        `,
        confirmButtonText: 'Scan ใหม่',
        confirmButtonColor: '#dc2626',
        returnFocus: false,
        focusConfirm: true,
      }).then(() => {
        this.scanForm = this.createEmptyScanForm();
    
        setTimeout(() => {
          this.focusScanFirst();
        }, 200);
      });
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
        next: () => {
          this.toast('success', 'Scan สำเร็จ');
  
          this.scanForm = this.createEmptyScanForm();
          this.isSavingScan = false;
  
          // ดึงจาก backend ใหม่ เพื่อให้ข้อมูลตรงกับ database แน่นอน
          this.fetchWosTemp();
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
      .post<FetchWosTempResp>(config.apiServer + '/api/issue/fetchBoxTempByHeadId', {
        headerId: this.header.id,
      })
      .subscribe({
        next: (res) => {
          this.savedRows = (res.results || []).map((row) => ({
            ...row,
            editQty: Number(row.qty || 0),
            isUpdatingQty: false,
          }));
          this.isLoadingRows = false;
          this.focusQr();
        },
        error: (err) => {
          console.error(err);
          this.savedRows = [];
          this.isLoadingRows = false;
  
          Swal.fire({
            title: 'Error',
            text: err?.error?.message || err.message || 'Load Box Temp fail',
            icon: 'error',
          });
        },
      });
  }

  onDeleteRow(row: WosTempRow) {
    if (!row?.id) return;
  
    Swal.fire({
      title: 'Delete WOS?',
      html: `
        <div style="text-align:left">
          <div><b>WOS:</b> ${row.wosNo}</div>
          <div><b>Lot:</b> ${row.lotNo}</div>
          <div><b>QTY:</b> ${row.qty}</div>
          <div style="margin-top:8px;color:#b91c1c">
            รายการนี้จะถูกลบออกจาก Box ปกติ
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
  
      this.isDeletingBox = true;
  
      this.http
        .post<any>(config.apiServer + '/api/issue/deleteBoxTempIssue', {
          boxTempId: row.id,
        })
        .subscribe({
          next: () => {
            this.isDeletingBox = false;
            this.toast('success', 'Delete Box Success');
  
            this.fetchWosTemp();
            this.focusQr();
          },
          error: (err) => {
            console.error(err);
            this.isDeletingBox = false;
  
            Swal.fire(
              'Error',
              err?.error?.message ||
                err?.error?.error ||
                err?.message ||
                'Delete Box fail',
              'error'
            );
          },
        });
    });
  }




  onUpdateBoxIssueTempQty(row: WosTempRow) {
    if (!this.header) {
      return this.toast('warning', 'ไม่พบ Header');
    }
  
    const boxTempId = Number(row.id);
    const qty = Number(row.editQty);
  
    if (!boxTempId) {
      return this.toast('warning', 'ไม่พบ Box Temp ID');
    }
  
    if (!Number.isFinite(qty) || qty <= 0) {
      row.editQty = row.qty;
  
      return Swal.fire({
        icon: 'warning',
        title: 'QTY ไม่ถูกต้อง',
        text: 'กรุณากรอก QTY มากกว่า 0',
      });
    }
  
    if (qty === Number(row.qty)) {
      return this.toast('info', 'QTY ไม่มีการเปลี่ยนแปลง');
    }
  
    row.isUpdatingQty = true;
  
    this.http
      .post<any>(config.apiServer + '/api/issue/editBoxIssueTemp', {
        headTempId: this.header.id,
        boxTempId,
        qty,
      })
      .subscribe({
        next: (res) => {
          row.qty = Number(res.data.qty);
          row.editQty = Number(res.data.qty);
          row.isUpdatingQty = false;
  
          this.toast('success', 'แก้ไข QTY Box ปกติสำเร็จ');
        },
        error: (err) => {
          console.error(err);
  
          row.editQty = row.qty;
          row.isUpdatingQty = false;
  
          const msg =
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Update Box Qty fail';
  
          if (msg === 'box_issueTemp_notFound') {
            Swal.fire('Warning', 'ไม่พบ Box ปกตินี้ในระบบ', 'warning');
            return;
          }
  
          if (msg === 'invalid_qty') {
            Swal.fire('Warning', 'QTY ต้องมากกว่า 0', 'warning');
            return;
          }
  
          Swal.fire({
            icon: 'error',
            title: 'แก้ไข QTY Box ปกติไม่สำเร็จ',
            text: msg,
          });
        },
      });
  }

  resetBoxIssueTempQty(row: WosTempRow) {
    row.editQty = row.qty;
  }



  onClearAllScan() {
    if (!this.header || this.savedRows.length === 0) return;
  
    Swal.fire({
      title: 'Clear All Normal Box?',
      html: `
        <div style="text-align:left">
          <div>ต้องการลบ Box ปกติทั้งหมด <b>${this.savedRows.length}</b> รายการใช่ไหม</div>
          <div style="margin-top:8px;color:#64748b">
            ระบบจะไม่ลบ Box ที่ถูกย้ายไปอยู่ใน Box เศษ
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Clear All',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then((r) => {
      if (!r.isConfirmed) return;
  
      this.isClearing = true;
  
      this.http
        .post<any>(config.apiServer + '/api/issue/deleteAllBoxTempIssue', {
          headerTempId: this.header!.id,
        })
        .subscribe({
          next: () => {
            this.isClearing = false;
            this.toast('success', 'Clear Normal Box Success');
  
            this.fetchWosTemp();
            this.fetchFractionTempList();
            this.focusQr();
          },
          error: (err) => {
            console.error(err);
            this.isClearing = false;
  
            Swal.fire(
              'Error',
              err?.error?.message ||
                err?.error?.error ||
                err?.message ||
                'Clear Normal Box fail',
              'error'
            );
          },
        });
    });
  }



  clearFractionScanForm() {
    this.fractionScanForm = this.createEmptyScanForm();
    this.focusFractionFirst();
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