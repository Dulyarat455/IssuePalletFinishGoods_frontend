import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

import Swal from 'sweetalert2';
import config from '../../config';

type RackGroup = 'ABC' | 'DE' | 'FGH';

type BoxType = 'FULL' | 'PARTIAL';

type BoxItem = {
  boxNo: string;
  lotNo: string;
  qty: number;
  type: BoxType;
};

type LabelItem = {
  labelId: string;
  itemNo: string;
  itemName: string;
  dieNo: string;
  oqcLotNo: string;
  qty: number;
  boxes: BoxItem[];
};

type PalletItem = {
  palletId: string;
  receivedDate: string;
  labels: LabelItem[];
};

type AreaRow = {
  areaId: number;
  areaName: string;
};

type RackApiRow = {
  rackId: number;
  rackName: string;
  areas: AreaRow[];
};

type RackSlot = {
  rackId: number;
  areaId: number;

  rack: string;
  code: string;
  displayCode: string;
  rackGroup: RackGroup;

  /*
    1 Rack No = 1 Pallet เท่านั้น
  */
  pallet: PalletItem | null;
};

type RackDefinition = {
  rackId: number;
  name: string;
  rackGroup: RackGroup;
  areas: AreaRow[];
};

@Component({
  selector: 'app-lay-out',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lay-out.component.html',
  styleUrl: './lay-out.component.css',
})
export class LayOutComponent implements OnInit {
  /* =====================================================
     RACK / AREA MASTER FROM API
  ===================================================== */

  rackDefinitions: RackDefinition[] = [];

  isLoadingRack = false;

  rackLoadError = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchLocations();
  }

  /* =====================================================
     LOAD RACK / AREA
  ===================================================== */

  fetchLocations(): void {
    this.isLoadingRack = true;

    this.rackLoadError = '';

    this.http.get<any>(config.apiServer + '/api/location/list').subscribe({
      next: (res: any) => {
        const rows: RackApiRow[] = Array.isArray(res?.results)
          ? res.results
          : [];

        this.rackDefinitions = rows.map((rack: RackApiRow) => ({
          rackId: Number(rack.rackId),

          name: String(rack.rackName || '').trim(),

          rackGroup: this.getRackGroupByName(rack.rackName),

          areas: Array.isArray(rack.areas)
            ? [...rack.areas]
                .map((area) => ({
                  areaId: Number(area.areaId),

                  areaName: String(area.areaName || '').trim(),
                }))
                .sort((a, b) => this.compareAreaName(a.areaName, b.areaName))
            : [],
        }));

        this.isLoadingRack = false;
      },

      error: (err) => {
        console.error('Load Rack Location Error:', err);

        this.rackDefinitions = [];

        this.isLoadingRack = false;

        this.rackLoadError =
          err?.error?.error ||
          err?.error?.message ||
          err?.message ||
          'Load rack location fail';

        Swal.fire({
          title: 'Error',
          text: this.rackLoadError,
          icon: 'error',
        });
      },
    });
  }

  /* =====================================================
     RACK GROUP

     สีหัว Rack ยังใช้ Logic เดิม
  ===================================================== */

  getRackGroupByName(rackName: string): RackGroup {
    const name = String(rackName || '')
      .trim()
      .toUpperCase();

    /*
      รองรับทั้ง
  
      A
      B
      C
  
      และ
  
      Rack A
      Rack B
      Rack C
    */

    const rackCode = name
      .replace('RACK', '')
      .replace(/[^A-Z]/g, '')
      .trim();

    if (rackCode === 'A' || rackCode === 'B' || rackCode === 'C') {
      return 'ABC';
    }

    if (rackCode === 'D' || rackCode === 'E') {
      return 'DE';
    }

    return 'FGH';
  }

  /* =====================================================
     AREA SORT
  ===================================================== */

  compareAreaName(a: string, b: string): number {
    return String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  /* =====================================================
     GROUP AREA INTO VISUAL ROWS

     101 201 301 401 501
     102 202 302 402 502
     ...
  ===================================================== */

  getAreaRows(rack: RackDefinition): AreaRow[][] {
    const rowMap = new Map<string, AreaRow[]>();

    const fallbackRows: AreaRow[][] = [];

    for (const area of rack.areas) {
      const areaName = String(area.areaName || '').trim();

      const match = areaName.match(/^(\d)(\d{2})$/);

      if (match) {
        const rowKey = match[2];

        if (!rowMap.has(rowKey)) {
          rowMap.set(rowKey, []);
        }

        rowMap.get(rowKey)!.push(area);
      } else {
        fallbackRows.push([area]);
      }
    }

    const normalRows = Array.from(rowMap.entries())
      .sort(([rowA], [rowB]) => Number(rowA) - Number(rowB))
      .map(([_, areas]) =>
        [...areas].sort((a, b) => this.compareAreaName(a.areaName, b.areaName))
      );

    return [...normalRows, ...fallbackRows];
  }

  /* =====================================================
     MOCK INVENTORY

     IMPORTANT:
     1 Rack No = 1 Pallet เท่านั้น
  ===================================================== */

  mockInventory: Record<string, PalletItem> = {
    /* =================================================
       Rack A-101
       มี 1 Pallet
       มี 2 Label / Model
    ================================================= */

    'Rack A-101': {
      palletId: '26801001',
      receivedDate: '2026-08-11',

      labels: [
        {
          labelId: '26801004',
          itemNo: '2605025005E',
          itemName: '99TL-PL35L024-VLA6',
          dieNo: 'B0595',
          oqcLotNo: 'S67258',
          qty: 3700,

          boxes: [
            {
              boxNo: 'BOX-001',
              lotNo: '24X24',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-002',
              lotNo: '24X24',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-003',
              lotNo: '24X27',
              qty: 1000,
              type: 'FULL',
            },

            /*
              Fraction / Partial
            */
            {
              boxNo: 'BOX-004',
              lotNo: '24X28',
              qty: 400,
              type: 'PARTIAL',
            },
            {
              boxNo: 'BOX-005',
              lotNo: '24X28',
              qty: 300,
              type: 'PARTIAL',
            },
          ],
        },

        {
          labelId: '26801005',
          itemNo: '2605025010A',
          itemName: '31ST-PL35L-024-1Y-2-CAR-D2',
          dieNo: 'P1078',
          oqcLotNo: 'S67259',
          qty: 2800,

          boxes: [
            {
              boxNo: 'BOX-006',
              lotNo: '24Y01',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-007',
              lotNo: '24Y01',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-008',
              lotNo: '24Y01',
              qty: 800,
              type: 'PARTIAL',
            },
          ],
        },
      ],
    },

    /* =================================================
       Rack A-201
    ================================================= */

    'Rack A-201': {
      palletId: '26802001',
      receivedDate: '2026-08-13',

      labels: [
        {
          labelId: '26802002',
          itemNo: '2208011055A',
          itemName: 'GENERATOR PLATE ASSY',
          dieNo: 'D8820',
          oqcLotNo: 'S68001',
          qty: 3000,

          boxes: [
            {
              boxNo: 'BOX-101',
              lotNo: '25A01',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-102',
              lotNo: '25A01',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-103',
              lotNo: '25A01',
              qty: 1000,
              type: 'FULL',
            },
          ],
        },
      ],
    },

    /* =================================================
       Rack B-305
    ================================================= */

    'Rack B-305': {
      palletId: '26803001',
      receivedDate: '2026-08-14',

      labels: [
        {
          labelId: '26803002',
          itemNo: '3102040007B',
          itemName: 'LAMINATION CORE',
          dieNo: 'L9012',
          oqcLotNo: 'S68120',
          qty: 1900,

          boxes: [
            {
              boxNo: 'BOX-201',
              lotNo: '25B11',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-202',
              lotNo: '25B11',
              qty: 500,
              type: 'PARTIAL',
            },
            {
              boxNo: 'BOX-203',
              lotNo: '25B11',
              qty: 400,
              type: 'PARTIAL',
            },
          ],
        },
      ],
    },

    /* =================================================
       Rack D-401
       กลุ่ม DE
    ================================================= */

    'Rack D-401': {
      palletId: '26804001',
      receivedDate: '2026-08-15',

      labels: [
        {
          labelId: '26804002',
          itemNo: '4201023001C',
          itemName: 'STATOR COMPONENT',
          dieNo: 'S3301',
          oqcLotNo: 'S68200',
          qty: 5500,

          boxes: [
            {
              boxNo: 'BOX-301',
              lotNo: '25C20',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-302',
              lotNo: '25C20',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-303',
              lotNo: '25C20',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-304',
              lotNo: '25C20',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-305',
              lotNo: '25C20',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-306',
              lotNo: '25C20',
              qty: 500,
              type: 'PARTIAL',
            },
          ],
        },

        {
          labelId: '26804003',
          itemNo: '4201023002B',
          itemName: 'STATOR CORE',
          dieNo: 'S3302',
          oqcLotNo: 'S68201',
          qty: 1700,

          boxes: [
            {
              boxNo: 'BOX-307',
              lotNo: '25C21',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-308',
              lotNo: '25C21',
              qty: 700,
              type: 'PARTIAL',
            },
          ],
        },
      ],
    },

    /* =================================================
       Rack F-202
       กลุ่ม FGH
    ================================================= */

    'Rack F-202': {
      palletId: '26805001',
      receivedDate: '2026-08-17',

      labels: [
        {
          labelId: '26805002',
          itemNo: '5501001120A',
          itemName: 'GENERATOR CORE',
          dieNo: 'G5100',
          oqcLotNo: 'S69010',
          qty: 2300,

          boxes: [
            {
              boxNo: 'BOX-401',
              lotNo: '26D01',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-402',
              lotNo: '26D01',
              qty: 1000,
              type: 'FULL',
            },
            {
              boxNo: 'BOX-403',
              lotNo: '26D01',
              qty: 300,
              type: 'PARTIAL',
            },
          ],
        },
      ],
    },
  };

  /* =====================================================
     STATE
  ===================================================== */

  selectedSlot: RackSlot | null = null;

  selectedLabel: LabelItem | null = null;

  /* =====================================================
     GET SLOT FROM API AREA

     Mock Pallet ยังใช้ key เดิม:
     Rack A-101
     Rack A-201
     ...
  ===================================================== */

  getSlot(rack: RackDefinition, area: AreaRow): RackSlot {
    /*
      Area จาก API
  
      เช่น
      101
      201
      305
    */

    const displayCode = String(area.areaName || '').trim();

    /*
      Rack API อาจส่ง
  
      A
      B
      C
  
      หรือ
  
      Rack A
      Rack B
  
      เราจะบังคับให้ Mock Key
      กลับเป็นรูปแบบเดิมเสมอ
  
      Rack A-101
    */

    let rackCode = String(rack.name || '')
      .trim()
      .toUpperCase();

    rackCode = rackCode
      .replace('RACK', '')
      .replace(/[^A-Z]/g, '')
      .trim();

    const mockRackName = `Rack ${rackCode}`;

    const key = `${mockRackName}-${displayCode}`;

    const pallet = this.mockInventory[key] || null;

    return {
      rackId: rack.rackId,

      areaId: area.areaId,

      rack: rack.name,

      code: key,

      displayCode: displayCode,

      rackGroup: rack.rackGroup,

      pallet: pallet,
    };
  }

  /* =====================================================
     SELECT SLOT
  ===================================================== */

  selectSlot(slot: RackSlot): void {
    this.selectedSlot = slot;

    if (slot.pallet && slot.pallet.labels.length > 0) {
      this.selectedLabel = slot.pallet.labels[0];
    } else {
      this.selectedLabel = null;
    }
  }

  /* =====================================================
     SELECT LABEL
  ===================================================== */

  selectLabel(label: LabelItem): void {
    this.selectedLabel = label;
  }

  /* =====================================================
     SLOT HAS PALLET
  ===================================================== */

  hasPallet(rack: RackDefinition, area: AreaRow): boolean {
    return this.getSlot(rack, area).pallet !== null;
  }

  /* =====================================================
     LABEL COUNT
  ===================================================== */

  getLabelCount(rack: RackDefinition, area: AreaRow): number {
    const pallet = this.getSlot(rack, area).pallet;

    if (!pallet) {
      return 0;
    }

    return pallet.labels.length;
  }

  /* =====================================================
     SELECTED
  ===================================================== */

  isSelected(rack: RackDefinition, area: AreaRow): boolean {
    if (!this.selectedSlot) {
      return false;
    }

    return (
      this.selectedSlot.rackId === rack.rackId &&
      this.selectedSlot.areaId === area.areaId
    );
  }

  /* =====================================================
     SORT BOX

     FULL ก่อน
     PARTIAL หลัง

     ภายใน Type เดียวกัน
     เรียงตาม Box No.
  ===================================================== */

  getSortedBoxes(label: LabelItem | null): BoxItem[] {
    if (!label) {
      return [];
    }

    return [...label.boxes].sort((a, b) => {
      /* FULL มาก่อน */
      if (a.type !== b.type) {
        return a.type === 'FULL' ? -1 : 1;
      }

      /* Type เดียวกัน เรียง Box No */
      return a.boxNo.localeCompare(b.boxNo, undefined, {
        numeric: true,

        sensitivity: 'base',
      });
    });
  }

  /* =====================================================
     BOX COUNTS
  ===================================================== */

  getFullBoxCount(label: LabelItem | null): number {
    if (!label) {
      return 0;
    }

    return label.boxes.filter((box) => box.type === 'FULL').length;
  }

  getPartialBoxCount(label: LabelItem | null): number {
    if (!label) {
      return 0;
    }

    return label.boxes.filter((box) => box.type === 'PARTIAL').length;
  }

  /* =====================================================
     SELECTED SLOT SUMMARY
  ===================================================== */

  get selectedPallet(): PalletItem | null {
    return this.selectedSlot?.pallet || null;
  }

  get selectedSlotLabelCount(): number {
    return this.selectedPallet?.labels.length || 0;
  }

  get selectedSlotBoxCount(): number {
    if (!this.selectedPallet) {
      return 0;
    }

    return this.selectedPallet.labels.reduce(
      (sum, label) => sum + label.boxes.length,
      0
    );
  }

  get selectedSlotQty(): number {
    if (!this.selectedPallet) {
      return 0;
    }

    return this.selectedPallet.labels.reduce(
      (sum, label) => sum + label.qty,
      0
    );
  }

  /* =====================================================
     OVERALL SUMMARY
  ===================================================== */

  get totalPallets(): number {
    return Object.keys(this.mockInventory).length;
  }

  get totalLabels(): number {
    return Object.values(this.mockInventory).reduce(
      (sum, pallet) => sum + pallet.labels.length,
      0
    );
  }

  get totalBoxes(): number {
    return Object.values(this.mockInventory)
      .flatMap((pallet) => pallet.labels)
      .reduce((sum, label) => sum + label.boxes.length, 0);
  }

  get totalQty(): number {
    return Object.values(this.mockInventory)
      .flatMap((pallet) => pallet.labels)
      .reduce((sum, label) => sum + label.qty, 0);
  }

  /* =====================================================
     RACK COLOR CLASS
  ===================================================== */

  getRackGroupClass(rackGroup: RackGroup): string {
    switch (rackGroup) {
      case 'ABC':
        return 'rack-group-abc';

      case 'DE':
        return 'rack-group-de';

      case 'FGH':
        return 'rack-group-fgh';

      default:
        return '';
    }
  }

  /* =====================================================
     PARTIAL ROW CLASS
  ===================================================== */

  getPartialRowClass(): string {
    if (!this.selectedSlot) {
      return '';
    }

    return this.getRackGroupClass(this.selectedSlot.rackGroup);
  }

  /* =====================================================
     TRACK BY
  ===================================================== */

  trackByRack(index: number, rack: RackDefinition): number {
    return rack.rackId;
  }

  trackByArea(index: number, area: AreaRow): number {
    return area.areaId;
  }

  trackByAreaRow(index: number, row: AreaRow[]): string {
    return row.map((area) => area.areaId).join('-');
  }

  trackByLabel(index: number, label: LabelItem): string {
    return label.labelId;
  }

  trackByBox(index: number, box: BoxItem): string {
    return box.boxNo;
  }
}
