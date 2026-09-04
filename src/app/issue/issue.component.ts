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

  mapAreaRackId: number;

  rackId: number;
  rackName: string;

  areaId: number;
  areaName: string;

  locationNo: string;
  name?: string;
};

type PalletTempRow = {
  id: number;
  date: string;
  shift: string;
  mapAreaRackId: number;
  labelType: LabelStockType;
  userId: number;
  status: string;
};

type IssueRackGroup = 'ABC' | 'DE' | 'FGH';

type IssueRackDefinition = {
  name: string;
  rackCode: string;
  rackGroup: IssueRackGroup;
  columns: number[];
  rows: number;
};

type IssueRackSlotView = {
  code: string;

  column: number;
  row: number;

  locationId: number | null;

  exists: boolean;

  canSelect: boolean;
};

type IssueRackRowView = {
  row: number;

  slots: IssueRackSlotView[];
};

type IssueRackView = {
  name: string;

  rackCode: string;

  rackGroup: IssueRackGroup;

  rows: IssueRackRowView[];
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

  movementMonth: string;

  totalQtyBox: number;

  normalQty?: number | null;

  fractionQty?: number;

  normalScannedQty?: number;

  fractionScannedQty?: number;

  palletTempId: number;

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
  results: HeaderIssuePalletTemp[];
};

type FetchWosTempResp = {
  results: WosTempRow[];
};

type LabelStockType = 'FG' | 'WIP';

type IssuePanel = 'normal' | 'fraction' | 'print';

type PalletCreateForm = {
  date: string;
  shift: string;
  locationId: number | null;
  labelType: LabelStockType;
};

type LabelPreviewGroupRow = {
  dieNo: string;
  lotNo: string;
  dwg: string;
  fullBoxText: string;
  partialBoxText: string;
  totalQty: number;
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
  @ViewChild('fractionItemName')
  fractionItemName!: ElementRef<HTMLInputElement>;
  @ViewChild('fractionWosNo') fractionWosNo!: ElementRef<HTMLInputElement>;
  @ViewChild('fractionDwg') fractionDwg!: ElementRef<HTMLInputElement>;
  @ViewChild('fractionDieNo') fractionDieNo!: ElementRef<HTMLInputElement>;
  @ViewChild('fractionLotNo') fractionLotNo!: ElementRef<HTMLInputElement>;
  @ViewChild('fractionQty') fractionQty!: ElementRef<HTMLInputElement>;

  userId: number | null = null;

  userGroupName = '';
  userSectionName = '';

  createPalletRackView: IssueRackView[] = [];
  createPalletSelectableLocations: LocationRow[] = [];

  pendingLocation: LocationRow | null = null;

  pendingAreaMode: 'LAMINATION' | 'GEN_PD' | 'GEN_PC' | '' = '';

  header: HeaderIssuePalletTemp | null = null;
  headers: HeaderIssuePalletTemp[] = [];
  showHeaderList = false;
  form: HeaderForm = this.createEmptyHeaderForm();
  scanForm: WosScanForm = this.createEmptyScanForm();

  groups: GroupRow[] = [];
  items: ItemMasterRow[] = [];
  controlLots: ControlLotRow[] = [];
  locations: LocationRow[] = [];
  savedRows: WosTempRow[] = [];

  fullBoxTagQty: number | null = null;
  isSavingFullBoxTag = false;

  showFractionSection = false;

  fractionHeader: HeaderTempFraction | null = null;
  fractionQtyBox: number | null = null;

  fractionScanForm: WosScanForm = this.createEmptyScanForm();
  fractionRows: FractionTempRow[] = [];

  labelStockType: LabelStockType = 'FG';
  currentLabelPageIndex = 0;
  activeIssuePanel: IssuePanel = 'normal';

  labelRowsPerPage = 3;

  isSavingFractionHeader = false;
  isSavingFractionScan = false;
  isLoadingFractionRows = false;

  movementMonthOptions: string[] = [];

  itemKeyword = '';
  filteredItems: ItemMasterRow[] = [];
  showItemDrop = false;

  showCreatePallet = true;

  palletCreateForm: PalletCreateForm = this.createEmptyPalletCreateForm();

  currentCalendarDate = '';

  palletTemp: PalletTempRow | null = null;

  isLoadingPalletTemp = false;
  isSavingPalletTemp = false;

  isEditingPalletTemp = false;

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

  isPrinting = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.userId = Number(localStorage.getItem('finish_goods_userId')) || null;

    const now = new Date();

    this.currentCalendarDate = this.formatLocalDate(now);

    this.userGroupName = String(
      localStorage.getItem('finish_goods_groupName') || ''
    )
      .trim()
      .toUpperCase();

    this.userSectionName = String(
      localStorage.getItem('finish_goods_sectionName') || ''
    )
      .trim()
      .toUpperCase();

    if (!this.userId) {
      Swal.fire('Error', 'ไม่พบ User ID กรุณา Login ใหม่', 'error');
      return;
    }

    this.generateMovementMonthOptions();

    this.fetchGroups();
    this.fetchItems();
    this.fetchControlLots();
    this.fetchLocations();

    this.fetchPalletTemp();
    this.fetchHeader();
  }

  ngAfterViewInit(): void {
    this.focusQr();
  }

  setIssuePanel(panel: IssuePanel): void {
    this.activeIssuePanel = panel;

    if (panel === 'normal') {
      setTimeout(() => this.focusScanFirst(), 0);
      return;
    }

    if (panel === 'fraction') {
      this.showFractionSection = true;
      setTimeout(() => this.focusFractionFirst(), 0);
    }
  }

  createEmptyPalletCreateForm(): PalletCreateForm {
    const now = new Date();

    const shift = this.getShiftFromCurrentTime(now);

    const productionDate = this.getProductionDateByShift(now, shift);

    return {
      date: productionDate,

      shift: shift,

      locationId: null,

      labelType: 'FG',
    };
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

  get headerNormalQtyValue(): number {
    return Number(this.fullBoxTagQty || 0);
  }

  get headerFractionQtyValue(): number {
    return Number(this.fractionQtyBox || 0);
  }

  get headerPlanTotalBox(): number {
    return this.headerNormalQtyValue + this.headerFractionQtyValue;
  }

  get headerTotalBoxQty(): number {
    return Number(this.header?.totalQtyBox || 0);
  }

  get totalScannedBoxCount(): number {
    return Number(this.scanCount || 0) + Number(this.fractionScanCount || 0);
  }

  get totalRequiredPlanBoxQty(): number {
    return (
      Number(this.normalRequiredBoxQty || 0) +
      Number(this.fractionQtyBoxValue || 0)
    );
  }

  get progressPercent(): number {
    if (!this.headerTotalBoxQty) return 0;

    return Math.min(
      100,
      Math.round((this.totalScannedBoxCount / this.headerTotalBoxQty) * 100)
    );
  }

  get planPercent(): number {
    if (!this.headerTotalBoxQty) return 0;

    return Math.min(
      100,
      Math.round((this.totalRequiredPlanBoxQty / this.headerTotalBoxQty) * 100)
    );
  }

  get savedNormalBoxQty(): number {
    return Number(this.header?.normalQty || 0);
  }

  get normalRequiredBoxQty(): number {
    return this.savedNormalBoxQty;
  }

  get hasNormalBoxQty(): boolean {
    return this.savedNormalBoxQty > 0;
  }

  get isBoxFull(): boolean {
    if (!this.header) return false;
    if (!this.hasNormalBoxQty) return false;

    return this.scanCount >= this.normalRequiredBoxQty;
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

  get normalQtyValue(): number {
    return Number(this.fullBoxTagQty || 0);
  }

  get fractionQtyBoxValue(): number {
    return Number(this.fractionQtyBox || this.fractionHeader?.qtyBox || 0);
  }

  get totalPlanBoxQty(): number {
    return this.normalQtyValue + this.fractionQtyBoxValue;
  }

  get isFullBoxTagChanged(): boolean {
    if (!this.header) return false;

    const savedQty = Number(this.header.normalQty || 0);
    const currentQty = Number(this.fullBoxTagQty || 0);

    return currentQty > 0 && currentQty !== savedQty;
  }

  get isFractionHeaderQtyChanged(): boolean {
    if (!this.fractionHeader) return false;

    const savedQty = Number(this.fractionHeader.qtyBox || 0);
    const currentQty = Number(this.fractionQtyBox || 0);

    return currentQty > 0 && currentQty !== savedQty;
  }

  get previewIdPallet(): string {
    const id = (this.header?.idPallet || '').trim();

    if (id && id !== 'Auto') return id;

    // Example ID Pallet ตามที่ต้องการก่อน
    return '260811001';
  }

  get previewEmpName(): string {
    const empNo = localStorage.getItem('finish_goods_empNo') || '';
    const name = localStorage.getItem('finish_goods_name') || '';
    const firstName = this.getFirstNameOnly(name);

    return `${empNo} ${firstName}`.trim() || '-';
  }

  get previewDate(): string {
    const raw = this.header?.issueDate || this.form.issueDate;

    if (!raw) return '-';

    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;

    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }

  get previewItemNo(): string {
    return this.header?.itemNo || this.form.itemNo || '-';
  }

  get previewItemName(): string {
    return this.header?.itemName || this.form.itemName || '-';
  }

  get previewOqcLot(): string {
    return this.header
      ? this.controlLotDisplayName(this.header.controlLotId)
      : '-';
  }

  get previewDieNo(): string {
    const firstNormal = this.savedRows.find((row) => (row.dieNo || '').trim());
    const firstFraction = this.fractionRows.find((row) =>
      (row.dieNo || '').trim()
    );

    return firstNormal?.dieNo || firstFraction?.dieNo || '-';
  }

  get previewLocation(): string {
    if (!this.palletTemp) {
      return '-';
    }

    return this.locationName(this.palletTemp.mapAreaRackId);
  }

  get previewMovement(): string {
    return this.header?.movementMonth || this.form.movementMonth || '-';
  }

  get labelPreviewGroups(): LabelPreviewGroupRow[] {
    const map = new Map<
      string,
      {
        lotNo: string;
        dwg: string;
        fullQtyList: number[];
        partialQtyList: number[];
      }
    >();

    const addRow = (row: WosTempRow, kind: 'FULL' | 'PARTIAL') => {
      const shortLotNo = this.getShortLotNo(row.lotNo || '-');
      const dwg = (row.dwg || '-').trim();

      // Group By เฉพาะ Lot No ที่ตัดแล้ว
      const key = shortLotNo || '-';

      if (!map.has(key)) {
        map.set(key, {
          lotNo: shortLotNo || '-',
          dwg,
          fullQtyList: [],
          partialQtyList: [],
        });
      }

      const target = map.get(key)!;
      const qty = Number(row.qty || 0);

      if (kind === 'FULL') {
        target.fullQtyList.push(qty);
      } else {
        target.partialQtyList.push(qty);
      }
    };

    this.savedRows.forEach((row) => addRow(row, 'FULL'));
    this.fractionRows.forEach((row) => addRow(row, 'PARTIAL'));

    return Array.from(map.values()).map((g) => {
      const fullTotal = g.fullQtyList.reduce((sum, qty) => sum + qty, 0);
      const partialTotal = g.partialQtyList.reduce((sum, qty) => sum + qty, 0);

      return {
        dieNo: this.previewDieNo,
        lotNo: g.lotNo,
        dwg: g.dwg,
        fullBoxText: this.qtyMultiplyText(g.fullQtyList),
        partialBoxText: this.qtyMultiplyText(g.partialQtyList),
        totalQty: fullTotal + partialTotal,
      };
    });
  }

  get labelPreviewPageCount(): number {
    const totalRows = this.labelPreviewGroups.length;
    return Math.max(1, Math.ceil(totalRows / this.labelRowsPerPage));
  }

  get activeLabelPageIndex(): number {
    return Math.min(
      Math.max(this.currentLabelPageIndex, 0),
      this.labelPreviewPageCount - 1
    );
  }

  get currentLabelPageNo(): number {
    return this.activeLabelPageIndex + 1;
  }

  get currentLabelRows(): LabelPreviewGroupRow[] {
    const start = this.activeLabelPageIndex * this.labelRowsPerPage;
    return this.labelPreviewGroups.slice(start, start + this.labelRowsPerPage);
  }

  get emptyLabelRows(): number[] {
    const emptyCount = Math.max(
      0,
      this.labelRowsPerPage - this.currentLabelRows.length
    );
    return Array.from({ length: emptyCount }, (_, i) => i);
  }

  get labelPreviewTotalQty(): number {
    return this.currentLabelRows.reduce((sum, row) => {
      return sum + Number(row.totalQty || 0);
    }, 0);
  }

  get labelRowNoOffset(): number {
    return this.activeLabelPageIndex * this.labelRowsPerPage;
  }

  get selectedCreatePalletLocation(): LocationRow | null {
    if (!this.palletCreateForm.locationId) {
      return null;
    }

    return (
      this.locations.find(
        (row) => Number(row.id) === Number(this.palletCreateForm.locationId)
      ) || null
    );
  }

  get isPalletFormLocked(): boolean {
    return !!this.palletTemp && !this.isEditingPalletTemp;
  }

  get currentPalletHeaders(): HeaderIssuePalletTemp[] {
    if (!this.palletTemp) {
      return [];
    }

    const palletTempId = Number(this.palletTemp.id);

    return this.headers.filter(
      (header) => Number(header.palletTempId) === palletTempId
    );
  }

  get createPalletRackGroups(): {
    rackName: string;
    locations: LocationRow[];
  }[] {
    const map = new Map<string, LocationRow[]>();

    for (const location of this.locations) {
      const locationText = String(location.locationNo || location.name || '')
        .trim()
        .toUpperCase();

      if (!locationText) {
        continue;
      }

      const match = locationText.match(/[A-Z]/);

      const rackName = match?.[0] || 'OTHER';

      if (!map.has(rackName)) {
        map.set(rackName, []);
      }

      map.get(rackName)!.push(location);
    }

    const rackOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const indexA = rackOrder.indexOf(a);

        const indexB = rackOrder.indexOf(b);

        return (indexA < 0 ? 999 : indexA) - (indexB < 0 ? 999 : indexB);
      })
      .map(([rackName, locations]) => ({
        rackName,

        locations: [...locations].sort((a, b) =>
          String(a.locationNo || a.name || '').localeCompare(
            String(b.locationNo || b.name || ''),
            undefined,
            {
              numeric: true,
            }
          )
        ),
      }));
  }

  buildCreatePalletSlotCode(column: number, row: number): string {
    return `${column}` + `${row.toString().padStart(2, '0')}`;
  }

  selectCreatePalletRackSlotView(slot: IssueRackSlotView): void {
    if (this.isPalletFormLocked) {
      return;
    }

    if (this.isSavingPalletTemp) {
      return;
    }

    if (!slot.exists) {
      return;
    }

    if (!slot.canSelect) {
      return;
    }

    if (slot.locationId == null) {
      return;
    }

    this.palletCreateForm.locationId = slot.locationId;
  }

  getCreatePalletRackGroupClass(rackGroup: IssueRackGroup): string {
    switch (rackGroup) {
      case 'ABC':
        return 'create-rack-group-abc';

      case 'DE':
        return 'create-rack-group-de';

      case 'FGH':
        return 'create-rack-group-fgh';

      default:
        return '';
    }
  }

  selectCreatePalletLocation(location: LocationRow): void {
    if (this.isPalletFormLocked) {
      return;
    }

    this.palletCreateForm.locationId = location.id;
  }

  isCreatePalletLocationSelected(location: LocationRow): boolean {
    return Number(this.palletCreateForm.locationId) === Number(location.id);
  }

  onNextCreatePallet(): void {
    if (!this.userId) {
      return this.toast('warning', 'ไม่พบ User ID');
    }

    // ===============================
    // มี Pallet อยู่แล้ว
    // ไม่ต้อง Create ซ้ำ
    // ไป Header ต่อได้เลย
    // ===============================

    if (this.palletTemp && !this.isEditingPalletTemp) {
      this.form.issueDate = this.palletCreateForm.date;

      this.form.shift = this.palletCreateForm.shift;

      this.form.locationId = this.palletTemp.mapAreaRackId;

      this.labelStockType = this.palletTemp.labelType;

      // โหลด Header ใหม่ก่อน
      this.fetchHeader(() => {
        this.openHeaderStepForCurrentPallet();
      });

      return;
    }
    // ถ้ายังอยู่ Edit Mode
    // ต้อง Save Edit ก่อน

    if (this.palletTemp && this.isEditingPalletTemp) {
      return this.toast('warning', 'กรุณา Save Edit Pallet ก่อน');
    }

    if (!this.palletCreateForm.date) {
      return this.toast('warning', 'กรุณาเลือก Date');
    }

    if (!this.palletCreateForm.shift) {
      return this.toast('warning', 'กรุณาเลือก Shift');
    }

    if (!this.palletCreateForm.locationId) {
      return this.toast('warning', 'กรุณาเลือก Location');
    }

    const mapAreaRackId = Number(this.palletCreateForm.locationId);

    const payload = {
      userId: Number(this.userId),

      date: new Date(this.palletCreateForm.date).toISOString(),

      shift: this.palletCreateForm.shift,

      mapAreaRackId: mapAreaRackId,

      labelType: this.palletCreateForm.labelType,
    };

    this.isSavingPalletTemp = true;

    this.http
      .post<any>(config.apiServer + '/api/issue/createPalletTemp', payload)
      .subscribe({
        next: (res: any) => {
          const palletTemp: PalletTempRow | null = res?.data || null;

          if (!palletTemp) {
            this.isSavingPalletTemp = false;

            Swal.fire('Error', 'ไม่พบข้อมูล Pallet Temp จาก API', 'error');

            return;
          }

          this.palletTemp = palletTemp;

          this.form.issueDate = this.palletCreateForm.date;

          this.form.shift = this.palletCreateForm.shift;

          this.form.locationId = Number(palletTemp.mapAreaRackId);

          this.labelStockType = palletTemp.labelType;

          this.isSavingPalletTemp = false;

          this.isSavingPalletTemp = false;

          // Pallet ใหม่ยังไม่มี Header
          // จึงไปหน้า Create Header

          this.showCreatePallet = false;

          this.showHeaderList = false;

          this.prepareCreateNewHeader();
        },

        error: (err) => {
          console.error(err);

          this.isSavingPalletTemp = false;

          Swal.fire(
            'Error',
            err?.error?.message || err.message || 'Create Pallet fail',
            'error'
          );
        },
      });
  }

  backToHeaderList(): void {
    this.resetSelectedHeaderData();

    this.showCreatePallet = false;

    this.showHeaderList = true;
  }

  fetchPalletTemp(): void {
    if (!this.userId) {
      return;
    }

    this.isLoadingPalletTemp = true;

    this.http
      .post<any>(config.apiServer + '/api/issue/fetchPalletTemp', {
        userId: Number(this.userId),
      })
      .subscribe({
        next: (res: any): void => {
          const raw = res?.results || null;

          // =========================
          // ยังไม่มี Pallet Temp
          // =========================

          if (!raw) {
            this.palletTemp = null;

            this.isEditingPalletTemp = false;

            this.isLoadingPalletTemp = false;

            return;
          }

          // =========================
          // Convert Label Type
          // =========================

          const labelType: LabelStockType =
            raw.labelType === 'WIP' ? 'WIP' : 'FG';

          // =========================
          // มี Pallet Temp
          // =========================

          const palletTemp: PalletTempRow = {
            id: Number(raw.id),

            date: raw.date,

            shift: raw.shift || '',

            mapAreaRackId: Number(raw.mapAreaRackId),

            labelType: labelType,

            userId: Number(raw.userId),

            status: raw.status || 'use',
          };

          this.palletTemp = palletTemp;

          // =========================
          // เอาค่าที่ Fetch ได้
          // กลับเข้า Create Pallet Form
          // =========================

          this.palletCreateForm = {
            date: this.toYmd(palletTemp.date),

            shift: palletTemp.shift,

            locationId: palletTemp.mapAreaRackId,

            labelType: palletTemp.labelType,
          };

          // =========================
          // Sync ค่าไป Header
          // =========================

          this.form.issueDate = this.palletCreateForm.date;

          this.form.shift = this.palletCreateForm.shift;

          this.form.locationId = palletTemp.mapAreaRackId;

          this.labelStockType = palletTemp.labelType;

          // =========================
          // Lock Pallet Form
          // =========================

          this.isEditingPalletTemp = false;

          this.isLoadingPalletTemp = false;
        },

        error: (err: any): void => {
          console.error(err);

          this.palletTemp = null;

          this.isEditingPalletTemp = false;

          this.isLoadingPalletTemp = false;

          Swal.fire(
            'Error',
            err?.error?.message ||
              err?.error?.error ||
              err?.message ||
              'Load Pallet Temp fail',
            'error'
          );
        },
      });
  }

  onEditPalletTemp(): void {
    if (!this.palletTemp) {
      return;
    }

    // =========================
    // ครั้งแรก = เข้า Edit Mode
    // =========================

    if (!this.isEditingPalletTemp) {
      // =========================
      // เปิด Edit Mode
      // =========================

      this.isEditingPalletTemp = true;

      // =========================
      // Refresh Date / Shift
      // ตามเวลาปัจจุบัน
      // =========================

      const now = new Date();

      const currentShift = this.getShiftFromCurrentTime(now);

      const productionDate = this.getProductionDateByShift(now, currentShift);

      // Production Date

      this.palletCreateForm.date = productionDate;

      // Current Shift

      this.palletCreateForm.shift = currentShift;

      // Current Calendar Date
      // ตัวนี้ Show อย่างเดียว
      // ไม่ส่ง Backend

      this.currentCalendarDate = this.formatLocalDate(now);

      return;
    }

    // =========================
    // Validate
    // =========================

    if (!this.palletCreateForm.date) {
      this.toast('warning', 'กรุณาเลือก Date');

      return;
    }

    if (!this.palletCreateForm.shift) {
      this.toast('warning', 'กรุณาเลือก Shift');

      return;
    }

    if (!this.palletCreateForm.locationId) {
      this.toast('warning', 'กรุณาเลือก Location');

      return;
    }

    if (!this.palletCreateForm.labelType) {
      this.toast('warning', 'กรุณาเลือก Label Type');

      return;
    }

    // =========================
    // Payload
    // =========================

    const payload = {
      palletTempId: Number(this.palletTemp.id),

      date: new Date(this.palletCreateForm.date).toISOString(),

      shift: this.palletCreateForm.shift,

      mapAreaRackId: Number(this.palletCreateForm.locationId),

      labelType: this.palletCreateForm.labelType,
    };

    this.isSavingPalletTemp = true;

    // =========================
    // API Edit Pallet
    // =========================

    this.http
      .post<any>(config.apiServer + '/api/issue/editPalletTemp', payload)
      .subscribe({
        next: (res: any): void => {
          const raw = res?.data || null;

          // =========================
          // API ไม่มี Data กลับมา
          // =========================

          if (!raw) {
            this.isSavingPalletTemp = false;

            Swal.fire('Error', 'ไม่พบข้อมูล Pallet Temp หลังจาก Edit', 'error');

            return;
          }

          // =========================
          // Convert Label Type
          // =========================

          const labelType: LabelStockType =
            raw.labelType === 'WIP' ? 'WIP' : 'FG';

          // =========================
          // Update Pallet Temp State
          // =========================

          const updatedPalletTemp: PalletTempRow = {
            id: Number(raw.id),

            date: raw.date,

            shift: raw.shift || '',

            mapAreaRackId: Number(raw.mapAreaRackId),

            labelType: labelType,

            userId: Number(raw.userId ?? this.userId),

            status: raw.status || 'use',
          };

          this.palletTemp = updatedPalletTemp;

          // =========================
          // Update Form
          // =========================

          this.palletCreateForm = {
            date: this.toYmd(updatedPalletTemp.date),

            shift: updatedPalletTemp.shift,

            locationId: updatedPalletTemp.mapAreaRackId,

            labelType: updatedPalletTemp.labelType,
          };

          // =========================
          // Sync Header
          // =========================

          this.form.issueDate = this.palletCreateForm.date;

          this.form.shift = this.palletCreateForm.shift;

          this.form.locationId = updatedPalletTemp.mapAreaRackId;

          this.labelStockType = updatedPalletTemp.labelType;

          // =========================
          // Finish
          // =========================

          this.isEditingPalletTemp = false;

          this.isSavingPalletTemp = false;

          this.toast('success', 'Edit Pallet Success');
        },

        error: (err: any): void => {
          console.error(err);

          this.isSavingPalletTemp = false;

          const msg =
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Edit Pallet fail';

          if (msg === 'missing_required_fields') {
            Swal.fire('Warning', 'กรุณากรอกข้อมูล Pallet ให้ครบ', 'warning');

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

  onDeletePalletTemp(): void {
    if (!this.palletTemp) {
      return;
    }

    Swal.fire({
      icon: 'info',
      title: 'Delete Pallet',
      text: 'ฟังก์ชัน Delete Pallet ยังไม่ได้เชื่อมต่อ API',
      confirmButtonText: 'OK',
    });
  }

  private qtyMultiplyText(qtyList: number[]): string {
    if (!qtyList.length) return '';

    const qtyMap = new Map<number, number>();

    qtyList.forEach((qty) => {
      qtyMap.set(qty, (qtyMap.get(qty) || 0) + 1);
    });

    return Array.from(qtyMap.entries())
      .map(([qty, count]) => {
        return `${this.formatNumber(qty)} x ${count}`;
      })
      .join(' + ');
  }

  formatNumber(value: number | null | undefined): string {
    return Number(value || 0).toLocaleString('en-US');
  }

  prevLabelPage() {
    if (this.activeLabelPageIndex <= 0) return;
    this.currentLabelPageIndex = this.activeLabelPageIndex - 1;
  }

  nextLabelPage() {
    if (this.activeLabelPageIndex >= this.labelPreviewPageCount - 1) return;
    this.currentLabelPageIndex = this.activeLabelPageIndex + 1;
  }

  onPalletShiftChange(): void {
    const shift = this.palletCreateForm.shift;

    if (shift !== 'A' && shift !== 'B' && shift !== 'C') {
      return;
    }

    const now = new Date();

    this.palletCreateForm.date = this.getProductionDateByShift(now, shift);
  }

  private getShiftFromCurrentTime(now: Date): 'A' | 'B' | 'C' {
    const hour = now.getHours();

    // Shift A
    // 07:00 - 14:59

    if (hour >= 7 && hour < 15) {
      return 'A';
    }

    // Shift B
    // 15:00 - 22:59

    if (hour >= 15 && hour < 23) {
      return 'B';
    }

    // Shift C
    // 23:00 - 06:59

    return 'C';
  }

  private getProductionDateByShift(now: Date, shift: 'A' | 'B' | 'C'): string {
    const productionDate = new Date(now);

    // ===================================
    // Shift C หลังเที่ยงคืน
    // 00:00 - 06:59
    //
    // ถือเป็น Production Date ของเมื่อวาน
    // ===================================

    if (shift === 'C' && now.getHours() < 7) {
      productionDate.setDate(productionDate.getDate() - 1);
    }

    return this.formatLocalDate(productionDate);
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private showBoxQtyOverLimitAlert(normalQty: number, fractionQty: number) {
    const totalBox = Number(this.header?.totalQtyBox || 0);
    const totalPlan = normalQty + fractionQty;

    return Swal.fire({
      icon: 'warning',
      title: 'จำนวน Box เกิน Header',
      html: `
        <div style="text-align:left">
          <div><b>QTY Box รวมจาก Header:</b> ${totalBox} Box</div>
          <div><b>QTY Box เต็ม:</b> ${normalQty} Box</div>
          <div><b>QTY Box เศษ:</b> ${fractionQty} Box</div>
          <hr />
          <div><b>รวมที่กำหนด:</b> ${totalPlan} Box</div>
  
          <div style="margin-top:10px;color:#b91c1c;font-weight:700">
            จำนวน Box เต็ม + Box เศษ ต้องไม่เกิน QTY Box รวมของ Header
          </div>
        </div>
      `,
      confirmButtonText: 'ตรวจสอบใหม่',
      confirmButtonColor: '#dc2626',
    });
  }

  private getCreatePalletRackProfile(): IssueRackDefinition[] {
    const group = this.userGroupName;

    const section = this.userSectionName;

    // =====================================================
    // CASE 1
    // LAMINATION
    // PC / PD / QC
    //
    // Show:
    // A B C D G
    //
    // G:
    // 101-112
    // 201-212
    // =====================================================

    if (
      group === 'LAMINATION' &&
      (section === 'PC' || section === 'PD' || section === 'QC')
    ) {
      return [
        {
          name: 'Rack A',
          rackCode: 'A',

          // สีส้ม
          rackGroup: 'ABC',

          columns: [1, 2, 3, 4, 5],
          rows: 15,
        },

        {
          name: 'Rack B',
          rackCode: 'B',

          rackGroup: 'ABC',

          columns: [1, 2, 3, 4, 5],
          rows: 15,
        },

        {
          name: 'Rack C',
          rackCode: 'C',

          rackGroup: 'ABC',

          columns: [1, 2, 3, 4, 5],
          rows: 15,
        },

        {
          name: 'Rack D',
          rackCode: 'D',

          // Case นี้ D เป็นสีส้ม
          rackGroup: 'ABC',

          columns: [1, 2, 3, 4, 5],
          rows: 12,
        },

        {
          name: 'Rack G',
          rackCode: 'G',

          // Case นี้ G เป็นสีส้ม
          rackGroup: 'ABC',

          // แสดงแค่
          // 101-112
          // 201-212
          columns: [1, 2],

          rows: 12,
        },
      ];
    }

    // =====================================================
    // CASE 2
    // GENERAL / STATOR
    // PD
    //
    // Show:
    // Rack E
    // Rack F เฉพาะ 301-312
    // =====================================================

    if ((group === 'GENERAL' || group === 'STATOR') && section === 'PD') {
      return [
        {
          name: 'Rack E',
          rackCode: 'E',

          // สีชมพู
          rackGroup: 'DE',

          columns: [1, 2, 3],
          rows: 12,
        },

        {
          name: 'F',
          rackCode: 'F',

          // Case นี้ F เป็นสีชมพู
          rackGroup: 'DE',

          // แสดงเฉพาะ
          // 301-312
          columns: [3],

          rows: 12,
        },
      ];
    }

    // =====================================================
    // CASE 3
    // GENERAL / STATOR
    // PC
    //
    // Show:
    // F G H
    //
    // F:
    // 101-112
    // 201-212
    // =====================================================

    if ((group === 'GENERAL' || group === 'STATOR') && section === 'PC') {
      return [
        {
          name: 'Rack F',
          rackCode: 'F',

          // สีเขียว
          rackGroup: 'FGH',

          columns: [1, 2],
          rows: 12,
        },

        {
          name: 'Rack G',
          rackCode: 'G',

          rackGroup: 'FGH',

          columns: [1, 2, 3, 4],
          rows: 12,
        },

        {
          name: 'Rack H',
          rackCode: 'H',

          rackGroup: 'FGH',

          columns: [1, 2, 3],
          rows: 12,
        },
      ];
    }

    // ไม่มีสิทธิ์
    // ไม่แสดง Rack

    return [];
  }

  private setupPendingAreaMode(): void {
    const group = this.userGroupName;

    const section = this.userSectionName;

    // ==========================================
    // CASE 1
    // Lamination PC / PD / QC
    // ==========================================

    if (
      group === 'LAMINATION' &&
      (section === 'PC' || section === 'PD' || section === 'QC')
    ) {
      this.pendingAreaMode = 'LAMINATION';

      return;
    }

    // ==========================================
    // CASE 2
    // General / Stator + PD
    // ==========================================

    if ((group === 'GENERAL' || group === 'STATOR') && section === 'PD') {
      this.pendingAreaMode = 'GEN_PD';

      return;
    }

    // ==========================================
    // CASE 3
    // General / Stator + PC
    // ==========================================

    if ((group === 'GENERAL' || group === 'STATOR') && section === 'PC') {
      this.pendingAreaMode = 'GEN_PC';

      return;
    }

    this.pendingAreaMode = '';
  }

  private canSelectRackSlot(rackCode: string, slotCode: string): boolean {
    const group = this.userGroupName;

    const section = this.userSectionName;

    const rack = String(rackCode).trim().toUpperCase();

    const slot = Number(slotCode);

    // =====================================================
    // CASE 1
    // LAMINATION
    // =====================================================

    if (group === 'LAMINATION') {
      // ===================================================
      // QC
      //
      // เลือกได้เฉพาะ Rack G
      //
      // 101
      // 102
      // 103
      // 201
      // 202
      // ===================================================

      if (section === 'QC') {
        if (rack !== 'G') {
          return false;
        }

        return (
          slot === 101 ||
          slot === 102 ||
          slot === 103 ||
          slot === 201 ||
          slot === 202
        );
      }

      // ===================================================
      // PD
      //
      // เลือกได้เฉพาะ Rack G
      //
      // 104 - 112
      // ===================================================

      if (section === 'PD') {
        if (rack !== 'G') {
          return false;
        }

        return slot >= 104 && slot <= 112;
      }

      // ===================================================
      // PC
      //
      // ของเดิม
      //
      // Rack A / B / C / D
      // เลือกได้ทั้งหมด
      //
      // Rack G
      // เลือกได้ 203 - 212
      // ===================================================

      if (section === 'PC') {
        // A / B / C / D

        if (rack === 'A' || rack === 'B' || rack === 'C' || rack === 'D') {
          return true;
        }

        // Rack G

        if (rack === 'G') {
          return slot >= 203 && slot <= 212;
        }

        return false;
      }

      return false;
    }

    // =====================================================
    // CASE 2
    // GENERAL / STATOR + PD
    //
    // ของเดิมไม่เปลี่ยน
    // =====================================================

    if ((group === 'GENERAL' || group === 'STATOR') && section === 'PD') {
      return rack === 'E' || rack === 'F';
    }

    // =====================================================
    // CASE 3
    // GENERAL / STATOR + PC
    //
    // ของเดิมไม่เปลี่ยน
    // =====================================================

    if ((group === 'GENERAL' || group === 'STATOR') && section === 'PC') {
      return rack === 'F' || rack === 'G' || rack === 'H';
    }

    return false;
  }

  private buildCreatePalletRackView(): void {
    // =====================================================
    // 1. สร้าง Map Location ครั้งเดียว
    //
    // A101 -> LocationRow
    // A102 -> LocationRow
    // B408 -> LocationRow
    // =====================================================

    const locationMap = new Map<string, LocationRow>();

    for (const location of this.locations) {
      const rackCode = String(location.rackName || '')
        .trim()
        .toUpperCase();

      const areaCode = String(location.areaName || '')
        .trim()
        .toUpperCase();

      if (!rackCode || !areaCode) {
        continue;
      }

      const key = rackCode + areaCode;

      locationMap.set(key, location);
    }

    // =====================================================
    // 2. Rack Profile ของ User
    // =====================================================

    const rackDefinitions = this.getCreatePalletRackProfile();

    // ==========================================
    // Pending Area
    // Master:
    // rackName = Pending
    // areaName = Pending
    // ==========================================

    this.pendingLocation = locationMap.get('PENDINGPENDING') || null;

    this.setupPendingAreaMode();

    const rackView: IssueRackView[] = [];

    const selectableLocationMap = new Map<number, LocationRow>();

    // Pending เลือกได้ทุก Role
    // ที่อยู่ใน Case ของ Layout นี้

    if (this.pendingLocation && this.pendingAreaMode) {
      selectableLocationMap.set(
        Number(this.pendingLocation.id),
        this.pendingLocation
      );
    }

    // =====================================================
    // 3. Build View
    //
    // ทำแค่ครั้งเดียว
    // หลัง fetchLocations สำเร็จ
    // =====================================================

    for (const rack of rackDefinitions) {
      const rows: IssueRackRowView[] = [];

      for (let row = 1; row <= rack.rows; row++) {
        const slots: IssueRackSlotView[] = [];

        for (const column of rack.columns) {
          const slotCode = `${column}${String(row).padStart(2, '0')}`;

          const key = `${rack.rackCode}${slotCode}`.toUpperCase();

          const location = locationMap.get(key) || null;

          const canSelect = this.canSelectRackSlot(rack.rackCode, slotCode);

          slots.push({
            code: slotCode,

            column: column,

            row: row,

            locationId: location ? Number(location.id) : null,

            exists: !!location,

            canSelect: !!location && canSelect,
          });

          // Dropdown
          // เก็บเฉพาะ Location
          // ที่ User เลือกได้

          if (location && canSelect) {
            selectableLocationMap.set(Number(location.id), location);
          }
        }

        rows.push({
          row: row,

          slots: slots,
        });
      }

      rackView.push({
        name: rack.name,

        rackCode: rack.rackCode,

        rackGroup: rack.rackGroup,

        rows: rows,
      });
    }

    // =====================================================
    // 4. Assign ทีเดียว
    // =====================================================

    this.createPalletRackView = rackView;

    this.createPalletSelectableLocations = Array.from(
      selectableLocationMap.values()
    ).sort((a, b) => {
      return String(a.name || a.locationNo || '').localeCompare(
        String(b.name || b.locationNo || ''),
        undefined,
        {
          numeric: true,
        }
      );
    });
  }

  selectPendingLocation(): void {
    if (this.isPalletFormLocked) {
      return;
    }

    if (this.isSavingPalletTemp) {
      return;
    }

    if (!this.pendingLocation) {
      return;
    }

    this.palletCreateForm.locationId = this.pendingLocation.id;
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

  private goToFractionPanelFromHeaderWarning(): void {
    /*
      ปิด Header Edit แบบ Cancel
      แต่ไม่เรียก onCancelEditHeader()
      เพราะ onCancelEditHeader() จะ focus กลับไปฝั่ง Box เต็ม
    */
    if (this.header) {
      this.form = this.mapHeaderToForm(this.header);
      this.itemKeyword = this.form.itemNo;
      this.fullBoxTagQty = this.header.normalQty ?? null;
      this.fractionQtyBox = this.fractionHeader?.qtyBox ?? null;
    }

    this.isEditingHeader = false;
    this.showFractionSection = true;
    this.activeIssuePanel = 'fraction';

    /*
      รอ Angular render panel ก่อน
      แล้วค่อย scroll ลงไป + focus Item No.
    */
    setTimeout(() => {
      const panel = document.getElementById('fractionPanelSection');

      panel?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      setTimeout(() => {
        this.focusEl(this.fractionItemNo);
      }, 350);
    }, 120);
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
    if (!raw) {
      return null;
    }

    return {
      id: Number(raw.id),

      // Date มาจาก Pallet

      issueDate:
        raw.issueDate || raw.dateIssue || this.palletCreateForm.date || '',

      // Shift มาจาก Pallet

      shift: raw.shift || this.palletCreateForm.shift || '',

      groupId: Number(raw.groupId),

      groupName: raw.groupName,

      itemNo: raw.itemNo || '',

      itemName: raw.itemName || '',

      controlLotId: Number(raw.controlLotId),

      controlLotName: raw.controlLotName,

      palletTempId: Number(raw.palletTempId),

      movementMonth: raw.movementMonth || raw.moveMentThreeMonth || '-',

      totalQtyBox: Number(raw.totalQtyBox ?? raw.totalBox ?? 0),

      normalQty: raw.normalQty == null ? null : Number(raw.normalQty),

      fractionQty: Number(raw.fractionQty || 0),

      normalScannedQty: Number(raw.normalScannedQty || 0),

      fractionScannedQty: Number(raw.fractionScannedQty || 0),

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
      // =================================
      // Date / Shift มาจาก Pallet
      // =================================

      issueDate: this.palletCreateForm.date || this.toYmd(h.issueDate),

      shift: this.palletCreateForm.shift || h.shift,

      groupId: h.groupId,

      itemNo: h.itemNo,

      itemName: h.itemName,

      controlLotId: h.controlLotId,

      locationId: this.palletTemp?.mapAreaRackId ?? null,

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
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
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

  private getFirstNameOnly(fullName: string): string {
    return (fullName || '').trim().split(/\s+/)[0] || '';
  }

  private getShortLotNo(lotNo: string): string {
    const raw = (lotNo || '').trim();

    // ตำแหน่งที่ 2 ถึง 6 แบบคนอ่าน = index 1 ถึง 5
    // L24X28ABSS -> 24X28
    if (raw.length >= 6) {
      return raw.substring(1, 6);
    }

    return raw;
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

  fetchLocations(): void {
    this.isLoadingMaster = true;

    this.http.get<any>(config.apiServer + '/api/location/list').subscribe({
      next: (res: any): void => {
        const racks = Array.isArray(res?.results) ? res.results : [];

        this.locations = racks.flatMap((rack: any) => {
          const rackName = String(rack.rackName || '').trim();

          return (rack.areas || []).map((area: any) => {
            const isPending =
              String(rackName).trim().toUpperCase() === 'PENDING' &&
              String(area.areaName).trim().toUpperCase() === 'PENDING';

            const displayName = isPending
              ? 'Pending'
              : `${rackName}-${area.areaName}`;

            return {
              id: Number(area.mapAreaRackId),

              mapAreaRackId: Number(area.mapAreaRackId),

              rackId: Number(rack.rackId),

              rackName: rackName,

              areaId: Number(area.areaId),

              areaName: String(area.areaName),

              locationNo: displayName,

              name: displayName,
            };
          });
        });

        // ==================================
        // Build Rack แค่ครั้งเดียว
        // ==================================

        this.buildCreatePalletRackView();

        this.checkMasterLoadingDone();
      },

      error: (err: any): void => {
        console.error(err);

        this.locations = [];

        this.createPalletRackView = [];

        this.createPalletSelectableLocations = [];

        this.checkMasterLoadingDone();

        Swal.fire({
          title: 'Error',

          text: err?.error?.message || err?.message || 'Load location fail',

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
  fetchHeader(afterLoad?: () => void): void {
    if (!this.userId) {
      return;
    }

    this.isLoadingHeader = true;

    this.http
      .post<FetchHeaderResp>(config.apiServer + '/api/issue/fetchHeaderTemp', {
        userId: Number(this.userId),
      })
      .subscribe({
        next: (res): void => {
          const rawList = Array.isArray(res?.results) ? res.results : [];

          const normalized = rawList
            .map((raw) => this.normalizeHeader(raw))
            .filter((row): row is HeaderIssuePalletTemp => row !== null);

          this.headers = normalized;

          this.isLoadingHeader = false;

          if (afterLoad) {
            afterLoad();
          }
        },

        error: (err): void => {
          console.error(err);

          this.headers = [];

          this.isLoadingHeader = false;

          Swal.fire(
            'Error',
            err?.error?.message ||
              err?.error?.error ||
              err?.message ||
              'Load Header fail',
            'error'
          );
        },
      });
  }

  onSaveHeader(): void {
    // =====================================================
    // VALIDATE
    // =====================================================

    if (!this.userId) {
      this.toast('warning', 'ไม่พบ User ID');

      return;
    }

    if (!this.palletTemp?.id) {
      this.toast('warning', 'ไม่พบ Pallet Temp');

      return;
    }

    if (!this.form.groupId) {
      this.toast('warning', 'เลือก Group');

      return;
    }

    if (!this.form.itemNo) {
      this.toast('warning', 'เลือก Item No.');

      return;
    }

    if (!this.form.itemName) {
      this.toast('warning', 'ไม่พบ Item Name');

      return;
    }

    if (!this.form.controlLotId) {
      this.toast('warning', 'เลือก Control Lot OQC');

      return;
    }

    if (!this.form.movementMonth) {
      this.toast('warning', 'เลือก Movement within 3 month');

      return;
    }

    // =====================================================
    // BOX QTY
    // =====================================================

    const normalQty = Number(this.fullBoxTagQty || 0);

    const fractionQty = Number(this.fractionQtyBox || 0);

    const totalBox = normalQty + fractionQty;

    if (!Number.isFinite(normalQty) || normalQty <= 0) {
      this.toast('warning', 'กรอก QTY Box เต็ม');

      return;
    }

    if (!Number.isFinite(fractionQty) || fractionQty < 0) {
      this.toast('warning', 'QTY Box เศษไม่ถูกต้อง');

      return;
    }

    if (totalBox <= 0) {
      this.toast('warning', 'Total QTY BOX ต้องมากกว่า 0');

      return;
    }

    // =====================================================
    // EDIT VALIDATION
    // ห้ามลดจำนวนต่ำกว่า Box ที่ Scan ไปแล้ว
    // =====================================================

    if (this.header && this.isEditingHeader && this.scanCount > normalQty) {
      Swal.fire({
        icon: 'warning',

        title: 'QTY Box เต็มน้อยกว่าจำนวนที่ Scan แล้ว',

        text:
          `ตอนนี้ Scan Box เต็มแล้ว ${this.scanCount} Box ` +
          `ไม่สามารถแก้ QTY Box เต็มเป็น ${normalQty} ได้`,
      });

      return;
    }

    // =====================================================
    // EDIT FRACTION = 0
    // แต่ยังมี Box เศษ Scan อยู่
    // =====================================================

    if (
      this.header &&
      this.isEditingHeader &&
      this.fractionHeader &&
      fractionQty === 0 &&
      this.fractionScanCount > 0
    ) {
      Swal.fire({
        icon: 'warning',

        title: 'ยังมี Box เศษที่ Scan ค้างอยู่',

        html: `
          <div style="text-align:left">
  
            <div>
              คุณกำลังเปลี่ยน
              <b>QTY Box เศษ</b>
              เป็น
              <b>0</b>
            </div>
  
            <div style="margin-top:8px">
              แต่ตอนนี้ยังมีรายการ
              Box เศษที่ Scan ค้างอยู่
  
              <b>
                ${this.fractionScanCount}
              </b>
  
              รายการ
            </div>
  
            <div
              style="
                margin-top:12px;
                color:#b91c1c;
                font-weight:700
              "
            >
              กรุณาไปลบหรือ Clear
              รายการ Box เศษก่อน
              แล้วจึงกลับมา Save Header อีกครั้ง
            </div>
  
          </div>
        `,

        confirmButtonText: 'ไปที่ Scan Box เศษ',

        confirmButtonColor: '#ea580c',
      }).then(() => {
        this.goToFractionPanelFromHeaderWarning();
      });

      return;
    }

    // =====================================================
    // EDIT FRACTION
    // ห้ามต่ำกว่าจำนวนที่ Scan แล้ว
    // =====================================================

    if (
      this.header &&
      this.isEditingHeader &&
      this.fractionScanCount > fractionQty
    ) {
      Swal.fire({
        icon: 'warning',

        title: 'QTY Box เศษน้อยกว่าจำนวนที่ Scan แล้ว',

        text:
          `ตอนนี้ Scan Box เศษแล้ว ${this.fractionScanCount} Box ` +
          `ไม่สามารถแก้ QTY Box เศษเป็น ${fractionQty} ได้`,
      });

      return;
    }

    // =====================================================
    // UPDATE LOCAL TOTAL
    // =====================================================

    this.form.totalQtyBox = totalBox;

    this.isSavingHeader = true;

    // =====================================================
    // CHECK CREATE / EDIT
    // =====================================================

    const isEditMode = !!this.header && this.isEditingHeader;

    // =====================================================
    // BASE PAYLOAD
    //
    // ใช้ได้ทั้ง Create / Edit
    // ตรงกับ Backend ใหม่
    // =====================================================

    const basePayload = {
      userId: Number(this.userId),

      itemNo: this.form.itemNo,

      itemName: this.form.itemName,

      groupId: Number(this.form.groupId),

      controlLotId: Number(this.form.controlLotId),

      totalBox: totalBox,

      moveMentThreeMonth: this.form.movementMonth,

      normalQty: normalQty,

      palletTempId: Number(this.palletTemp.id),
    };

    // =====================================================
    // CREATE / EDIT PAYLOAD
    // =====================================================

    const finalPayload = isEditMode
      ? {
          ...basePayload,

          headerTempId: Number(this.header!.id),
        }
      : basePayload;

    // =====================================================
    // URL
    // =====================================================

    const url = isEditMode
      ? config.apiServer + '/api/issue/editHeaderTemp'
      : config.apiServer + '/api/issue/createHeaderTemp';

    // =====================================================
    // CALL API
    // =====================================================

    this.http.post<any>(url, finalPayload).subscribe({
      next: (res: any): void => {
        // =================================================
        // Backend Header ไม่มี Date / Shift แล้ว
        // เพราะอยู่ที่ PalletTemp
        //
        // จึงเติมค่าจาก Pallet กลับเข้ามา
        // สำหรับใช้งานใน Frontend
        // =================================================

        const rawHeader = {
          ...res.data,

          issueDate: this.palletCreateForm.date,

          shift: this.palletCreateForm.shift,
        };

        this.header = this.normalizeHeader(rawHeader);

        if (!this.header) {
          this.isSavingHeader = false;

          Swal.fire('Error', 'Save Header แล้วไม่พบข้อมูล Header', 'error');

          return;
        }

        // =================================================
        // Sync Value
        // =================================================

        this.header = {
          ...this.header,

          totalQtyBox: totalBox,

          normalQty: normalQty,

          issueDate: this.palletCreateForm.date,

          shift: this.palletCreateForm.shift,
        };

        this.form = this.mapHeaderToForm(this.header);

        this.form.totalQtyBox = totalBox;

        this.itemKeyword = this.form.itemNo;

        this.fullBoxTagQty = normalQty;

        // =================================================
        // Fraction
        // =================================================

        this.syncFractionHeaderAfterHeaderSave(fractionQty, isEditMode);
      },

      error: (err: any): void => {
        console.error(err);

        this.isSavingHeader = false;

        const msg =
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Save Header fail';

        if (msg === 'missing_required_fields') {
          Swal.fire('Warning', 'กรุณากรอกข้อมูล Header ให้ครบ', 'warning');

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

  private openHeaderStepForCurrentPallet(): void {
    if (!this.palletTemp) {
      return;
    }

    const palletHeaders = this.currentPalletHeaders;

    this.showCreatePallet = false;

    // =========================
    // มี Header แล้ว
    // แสดง Header List
    // =========================

    if (palletHeaders.length > 0) {
      this.header = null;

      this.showHeaderList = true;

      this.resetSelectedHeaderData();

      return;
    }

    // =========================
    // ยังไม่มี Header
    // เข้า Create Header ทันที
    // =========================

    this.showHeaderList = false;

    this.prepareCreateNewHeader();
  }

  private resetSelectedHeaderData(): void {
    this.header = null;

    this.savedRows = [];

    this.scanForm = this.createEmptyScanForm();

    this.fullBoxTagQty = null;

    this.showFractionSection = false;

    this.fractionHeader = null;

    this.fractionQtyBox = null;

    this.fractionRows = [];

    this.fractionScanForm = this.createEmptyScanForm();

    this.isEditingHeader = false;

    this.activeIssuePanel = 'normal';
  }

  prepareCreateNewHeader(): void {
    this.resetSelectedHeaderData();

    this.showHeaderList = false;

    const newForm = this.createEmptyHeaderForm();

    if (this.palletTemp) {
      newForm.issueDate = this.toYmd(this.palletTemp.date);

      newForm.shift = this.palletTemp.shift;

      newForm.locationId = this.palletTemp.mapAreaRackId;

      this.labelStockType = this.palletTemp.labelType;
    }

    this.form = newForm;

    this.itemKeyword = '';

    this.isEditingHeader = false;
  }

  selectHeaderFromList(selectedHeader: HeaderIssuePalletTemp): void {
    this.header = selectedHeader;

    this.showHeaderList = false;

    this.showCreatePallet = false;

    // =========================
    // Header Form
    // =========================

    this.form = this.mapHeaderToForm(selectedHeader);

    this.itemKeyword = this.form.itemNo;

    this.fullBoxTagQty = selectedHeader.normalQty ?? null;

    // =========================
    // Clear ของ Header ก่อนหน้า
    // =========================

    this.savedRows = [];

    this.scanForm = this.createEmptyScanForm();

    this.fractionHeader = null;

    this.fractionQtyBox = selectedHeader.fractionQty ?? null;

    this.fractionRows = [];

    this.fractionScanForm = this.createEmptyScanForm();

    this.showFractionSection = false;

    this.isEditingHeader = false;

    this.activeIssuePanel = 'normal';

    // =========================
    // โหลด Detail ของ Header นี้
    // =========================

    this.fetchWosTemp();

    this.fetchFractionTempList();

    setTimeout(() => {
      this.focusQr();
    }, 0);
  }

  private syncFractionHeaderAfterHeaderSave(
    fractionQty: number,
    isHeaderEditMode: boolean
  ) {
    if (!this.header) return;

    if (fractionQty <= 0) {
      if (this.fractionHeader && this.fractionRows.length === 0) {
        this.http
          .post<any>(config.apiServer + '/api/issue/deleteheaderFractionTemp', {
            headerFractionTempId: this.fractionHeader.id,
          })
          .subscribe({
            next: () => {
              this.fractionHeader = null;
              this.fractionQtyBox = 0;
              this.fractionRows = [];
              this.fractionScanForm = this.createEmptyScanForm();

              this.finishHeaderSave(isHeaderEditMode);
            },
            error: (err) => {
              console.error(err);
              this.isSavingHeader = false;
              Swal.fire(
                'Error',
                err?.error?.message ||
                  err?.error?.error ||
                  err.message ||
                  'Delete Header Box เศษ fail',
                'error'
              );
            },
          });
        return;
      }

      this.fractionQtyBox = 0;
      this.finishHeaderSave(isHeaderEditMode);
      return;
    }

    const isEditFraction = !!this.fractionHeader;
    const url = isEditFraction
      ? config.apiServer + '/api/issue/editFractionTemp'
      : config.apiServer + '/api/issue/createHeaderTempFraction';

    const payload = isEditFraction
      ? {
          headFractionTempId: this.fractionHeader!.id,
          headTempId: this.header.id,
          qtyBox: fractionQty,
        }
      : {
          headTempId: this.header.id,
          qtyBox: fractionQty,
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
        this.showFractionSection = true;
        this.finishHeaderSave(isHeaderEditMode);
      },
      error: (err) => {
        console.error(err);
        this.isSavingHeader = false;

        const msg =
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Save Header Fraction fail';

        Swal.fire('Error', msg, 'error');
      },
    });
  }

  private finishHeaderSave(isEditMode: boolean) {
    this.isEditingHeader = false;
    this.isSavingHeader = false;

    this.toast(
      'success',
      isEditMode ? 'Edit Header Success' : 'Save Header Success'
    );
    // Update Header List
    this.fetchHeader();

    this.fetchWosTemp();
    this.fetchFractionTempList();
    this.focusQr();
  }

  onEditHeader() {
    if (!this.header) return;
    this.form = this.mapHeaderToForm(this.header);
    this.itemKeyword = this.form.itemNo;
    this.fullBoxTagQty = this.header.normalQty ?? null;
    this.fractionQtyBox =
      this.fractionHeader?.qtyBox ?? this.fractionQtyBox ?? null;
    this.isEditingHeader = true;
  }

  onCancelEditHeader() {
    if (!this.header) return;
    this.form = this.mapHeaderToForm(this.header);
    this.itemKeyword = this.form.itemNo;
    this.fullBoxTagQty = this.header.normalQty ?? null;
    this.fractionQtyBox = this.fractionHeader?.qtyBox ?? null;
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

            // clear QTY Box เต็ม
            this.fullBoxTagQty = null;
            this.isSavingFullBoxTag = false;

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

    if (!this.hasNormalBoxQty) {
      return Swal.fire({
        icon: 'warning',
        title: 'กรุณาระบุ QTY Box เต็มก่อน',
        html: `
          <div style="text-align:left">
            <div>
              ก่อนสร้าง Header Box เศษ ต้องระบุจำนวน <b>QTY Box เต็ม</b> ก่อน
            </div>
    
            <div style="margin-top:10px;color:#64748b">
              กรุณากรอก QTY Box เต็ม แล้วกด <b>Save Tag</b>
            </div>
          </div>
        `,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#dc2626',
      });
    }

    if (this.fractionQtyBox == null || Number(this.fractionQtyBox) <= 0) {
      return this.toast('warning', 'กรุณากรอก QTY BOX เศษ');
    }

    const normalQty = Number(this.fullBoxTagQty || this.header.normalQty || 0);
    const fractionQty = Number(this.fractionQtyBox || 0);
    const totalHeaderQty = Number(this.header.totalQtyBox || 0);

    if (normalQty + fractionQty > totalHeaderQty) {
      return this.showBoxQtyOverLimitAlert(normalQty, fractionQty);
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
          Swal.fire('Warning', 'ไม่พบ Header Box เศษนี้ในระบบ', 'warning');
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
      .post<any>(config.apiServer + '/api/issue/editFractionBoxTemp', {
        headFractionTempId: this.fractionHeader.id,
        headTempId: this.header.id,
        boxTempId,
        qty,
      })
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
            Swal.fire('Warning', 'ไม่พบข้อมูล Map ของ Box เศษนี้', 'warning');
            return;
          }

          if (msg === 'box_issueTemp_notFound') {
            Swal.fire('Warning', 'ไม่พบ Box เศษนี้ในระบบ', 'warning');
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
      .post<any>(config.apiServer + '/api/issue/mapFractionTemp', {
        headTempId: this.header.id,
        headFractionId: this.fractionHeader.id,
        itemNo: data.itemNo,
        itemName: data.itemName,
        wosNo: data.wosNo,
        dwg: data.dwg,
        dieNo: data.dieNo,
        lotNo: data.lotNo,
        qty: data.qty,
      })
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

    if (!this.scanForm.itemNo)
      return this.toast('warning', 'กรุณากรอก Item No.');
    if (!this.scanForm.itemName)
      return this.toast('warning', 'กรุณากรอก Item Name');
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
      document.activeElement instanceof HTMLElement &&
        document.activeElement.blur();

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
            text:
              err?.error?.message || err?.message || 'Confirm Scan ไม่สำเร็จ',
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

  onSaveFullBoxTag() {
    if (!this.header || this.isEditingHeader) {
      return this.toast('warning', 'กรุณาบันทึก Header หลักก่อน');
    }

    if (this.fullBoxTagQty == null || Number(this.fullBoxTagQty) <= 0) {
      return this.toast('warning', 'กรุณากรอก QTY Box เต็ม');
    }

    const normalQty = Number(this.fullBoxTagQty);
    const fractionQty = Number(
      this.fractionQtyBox || this.fractionHeader?.qtyBox || 0
    );
    const totalHeaderQty = Number(this.header.totalQtyBox || 0);

    if (!Number.isFinite(normalQty) || normalQty <= 0) {
      return this.toast('warning', 'QTY Box เต็มไม่ถูกต้อง');
    }

    if (this.scanCount > normalQty) {
      return Swal.fire({
        icon: 'warning',
        title: 'QTY Box เต็มน้อยกว่าจำนวนที่ Scan แล้ว',
        html: `
          <div style="text-align:left">
            <div><b>Scan Box ปกติแล้ว:</b> ${this.scanCount} Box</div>
            <div><b>QTY Box เต็มที่กรอก:</b> ${normalQty} Box</div>
  
            <div style="margin-top:10px;color:#b91c1c;font-weight:700">
              ไม่สามารถกำหนด QTY Box เต็มให้น้อยกว่าจำนวน Box ปกติที่ Scan แล้ว
            </div>
          </div>
        `,
        confirmButtonText: 'ตรวจสอบใหม่',
        confirmButtonColor: '#dc2626',
      });
    }

    if (normalQty + fractionQty > totalHeaderQty) {
      return this.showBoxQtyOverLimitAlert(normalQty, fractionQty);
    }

    this.isSavingFullBoxTag = true;

    this.http
      .post<any>(config.apiServer + '/api/issue/addNormalQty', {
        headTempId: this.header.id,
        normalQty,
      })
      .subscribe({
        next: (res) => {
          this.isSavingFullBoxTag = false;

          const updatedNormalQty = Number(res?.data?.normalQty ?? normalQty);

          this.fullBoxTagQty = updatedNormalQty;

          this.header = {
            ...this.header!,
            normalQty: updatedNormalQty,
          };

          this.toast('success', 'บันทึก QTY Box เต็มสำเร็จ');

          setTimeout(() => {
            this.focusScanFirst();
          }, 150);
        },
        error: (err) => {
          console.error(err);
          this.isSavingFullBoxTag = false;

          const msg =
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Save Normal QTY fail';

          if (msg === 'header_issueTemp_notFound') {
            Swal.fire('Warning', 'ไม่พบ Header นี้ในระบบ', 'warning');
            return;
          }

          Swal.fire({
            icon: 'error',
            title: 'บันทึก QTY Box เต็มไม่สำเร็จ',
            text: msg,
          });
        },
      });
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
      .post<FetchWosTempResp>(
        config.apiServer + '/api/issue/fetchBoxTempByHeadId',
        {
          headerId: this.header.id,
        }
      )
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
    if (this.savedRows.length === 0)
      return this.toast('warning', 'ยังไม่มีรายการ Scan');

    Swal.fire({
      title: 'Confirm Issue Pallet?',
      html: `
        <div style="text-align:left">
          <div><b>ID Pallet:</b> ${this.header.idPallet}</div>
          <div><b>Item:</b> ${this.header.itemNo} - ${
        this.header.itemName
      }</div>
          <div><b>Location:</b> ${this.locationName(
            this.palletTemp?.mapAreaRackId
          )}</div>
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

  printFullLabel(): void {
    if (!this.header?.id) {
      Swal.fire('Warning', 'ไม่พบ Header สำหรับ Print', 'warning');
      return;
    }

    this.isPrinting = true as any;

    this.http
      .post(
        config.apiServer + '/api/issue/printFullLabel',
        {
          headerId: this.header.id,
          labelType: this.labelStockType || 'FG',
        },
        { responseType: 'blob' }
      )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');

          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 10000);

          this.isPrinting = false as any;
        },
        error: (err) => {
          this.isPrinting = false as any;
          Swal.fire(
            'Error',
            err?.error?.message || 'Print Full Label failed',
            'error'
          );
        },
      });
  }
}
