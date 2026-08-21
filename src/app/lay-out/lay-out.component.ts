import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type RackGroup =
  | 'ABC'
  | 'DE'
  | 'FGH';

type BoxType =
  | 'FULL'
  | 'PARTIAL';

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

type RackSlot = {
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
  name: string;
  rackGroup: RackGroup;
  columns: number[];
  rows: number;
};

@Component({
  selector: 'app-lay-out',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './lay-out.component.html',
  styleUrl: './lay-out.component.css'
})
export class LayOutComponent {

  /* =====================================================
     RACK MASTER
  ===================================================== */

  rackDefinitions: RackDefinition[] = [
    {
      name: 'Rack A',
      rackGroup: 'ABC',
      columns: [1, 2, 3, 4, 5],
      rows: 15
    },
    {
      name: 'Rack B',
      rackGroup: 'ABC',
      columns: [1, 2, 3, 4, 5],
      rows: 15
    },
    {
      name: 'Rack C',
      rackGroup: 'ABC',
      columns: [1, 2, 3, 4, 5],
      rows: 15
    },
    {
      name: 'Rack D',
      rackGroup: 'DE',
      columns: [1, 2, 3, 4, 5],
      rows: 12
    },
    {
      name: 'Rack E',
      rackGroup: 'DE',
      columns: [1, 2, 3],
      rows: 12
    },
    {
      name: 'Rack F',
      rackGroup: 'FGH',
      columns: [1, 2],
      rows: 12
    },
    {
      name: 'Rack G',
      rackGroup: 'FGH',
      columns: [1, 2, 3, 4],
      rows: 12
    },
    {
      name: 'Rack H',
      rackGroup: 'FGH',
      columns: [1, 2, 3],
      rows: 12
    }
  ];


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
              type: 'FULL'
            },
            {
              boxNo: 'BOX-002',
              lotNo: '24X24',
              qty: 1000,
              type: 'FULL'
            },
            {
              boxNo: 'BOX-003',
              lotNo: '24X27',
              qty: 1000,
              type: 'FULL'
            },

            /*
              Fraction / Partial
            */
            {
              boxNo: 'BOX-004',
              lotNo: '24X28',
              qty: 400,
              type: 'PARTIAL'
            },
            {
              boxNo: 'BOX-005',
              lotNo: '24X28',
              qty: 300,
              type: 'PARTIAL'
            }
          ]
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
              type: 'FULL'
            },
            {
              boxNo: 'BOX-007',
              lotNo: '24Y01',
              qty: 1000,
              type: 'FULL'
            },
            {
              boxNo: 'BOX-008',
              lotNo: '24Y01',
              qty: 800,
              type: 'PARTIAL'
            }
          ]
        }
      ]
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
              type: 'FULL'
            },
            {
              boxNo: 'BOX-102',
              lotNo: '25A01',
              qty: 1000,
              type: 'FULL'
            },
            {
              boxNo: 'BOX-103',
              lotNo: '25A01',
              qty: 1000,
              type: 'FULL'
            }
          ]
        }
      ]
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
              type: 'FULL'
            },
            {
              boxNo: 'BOX-202',
              lotNo: '25B11',
              qty: 500,
              type: 'PARTIAL'
            },
            {
              boxNo: 'BOX-203',
              lotNo: '25B11',
              qty: 400,
              type: 'PARTIAL'
            }
          ]
        }
      ]
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
              type: 'FULL'
            },
            {
              boxNo: 'BOX-302',
              lotNo: '25C20',
              qty: 1000,
              type: 'FULL'
            },
            {
              boxNo: 'BOX-303',
              lotNo: '25C20',
              qty: 1000,
              type: 'FULL'
            },
            {
              boxNo: 'BOX-304',
              lotNo: '25C20',
              qty: 1000,
              type: 'FULL'
            },
            {
              boxNo: 'BOX-305',
              lotNo: '25C20',
              qty: 1000,
              type: 'FULL'
            },
            {
              boxNo: 'BOX-306',
              lotNo: '25C20',
              qty: 500,
              type: 'PARTIAL'
            }
          ]
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
              type: 'FULL'
            },
            {
              boxNo: 'BOX-308',
              lotNo: '25C21',
              qty: 700,
              type: 'PARTIAL'
            }
          ]
        }
      ]
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
              type: 'FULL'
            },
            {
              boxNo: 'BOX-402',
              lotNo: '26D01',
              qty: 1000,
              type: 'FULL'
            },
            {
              boxNo: 'BOX-403',
              lotNo: '26D01',
              qty: 300,
              type: 'PARTIAL'
            }
          ]
        }
      ]
    }
  };


  /* =====================================================
     STATE
  ===================================================== */

  selectedSlot: RackSlot | null = null;

  selectedLabel: LabelItem | null = null;


  /* =====================================================
     BUILD SLOT CODE
  ===================================================== */

  buildSlotCode(
    column: number,
    row: number
  ): string {

    return (
      `${column}` +
      `${row.toString().padStart(2, '0')}`
    );
  }


  /* =====================================================
     GET SLOT
  ===================================================== */

  getSlot(
    rack: RackDefinition,
    column: number,
    row: number
  ): RackSlot {

    const displayCode =
      this.buildSlotCode(
        column,
        row
      );


    const key =
      `${rack.name}-${displayCode}`;


    return {
      rack:
        rack.name,

      code:
        key,

      displayCode:
        displayCode,

      rackGroup:
        rack.rackGroup,

      pallet:
        this.mockInventory[key] || null
    };
  }


  /* =====================================================
     ROWS
  ===================================================== */

  getRows(
    rack: RackDefinition
  ): number[] {

    return Array.from(
      {
        length:
          rack.rows
      },
      (
        _,
        index
      ) =>
        index + 1
    );
  }


  /* =====================================================
     SELECT SLOT
  ===================================================== */

  selectSlot(
    slot: RackSlot
  ): void {

    this.selectedSlot =
      slot;


    if (
      slot.pallet &&
      slot.pallet.labels.length > 0
    ) {

      this.selectedLabel =
        slot.pallet.labels[0];

    } else {

      this.selectedLabel =
        null;

    }
  }


  /* =====================================================
     SELECT LABEL
  ===================================================== */

  selectLabel(
    label: LabelItem
  ): void {

    this.selectedLabel =
      label;
  }


  /* =====================================================
     SLOT HAS PALLET
  ===================================================== */

  hasPallet(
    rack: RackDefinition,
    column: number,
    row: number
  ): boolean {

    return (
      this.getSlot(
        rack,
        column,
        row
      ).pallet !== null
    );
  }


  /* =====================================================
     LABEL COUNT

     Badge มุม Rack No
  ===================================================== */

  getLabelCount(
    rack: RackDefinition,
    column: number,
    row: number
  ): number {

    const pallet =
      this.getSlot(
        rack,
        column,
        row
      ).pallet;


    if (!pallet) {
      return 0;
    }


    return pallet.labels.length;
  }


  /* =====================================================
     SELECTED
  ===================================================== */

  isSelected(
    rack: RackDefinition,
    column: number,
    row: number
  ): boolean {

    if (!this.selectedSlot) {
      return false;
    }


    const code =
      this.buildSlotCode(
        column,
        row
      );


    return (
      this.selectedSlot.rack === rack.name &&
      this.selectedSlot.displayCode === code
    );
  }


  /* =====================================================
     SORT BOX

     FULL ก่อน
     PARTIAL หลัง

     ภายใน Type เดียวกัน
     เรียงตาม Box No.
  ===================================================== */

  getSortedBoxes(
    label: LabelItem | null
  ): BoxItem[] {

    if (!label) {
      return [];
    }


    return [
      ...label.boxes
    ].sort(
      (
        a,
        b
      ) => {

        /* FULL มาก่อน */
        if (
          a.type !== b.type
        ) {

          return (
            a.type === 'FULL'
              ? -1
              : 1
          );
        }


        /* Type เดียวกัน เรียง Box No */
        return a.boxNo.localeCompare(
          b.boxNo,
          undefined,
          {
            numeric:
              true,

            sensitivity:
              'base'
          }
        );
      }
    );
  }


  /* =====================================================
     BOX COUNTS
  ===================================================== */

  getFullBoxCount(
    label: LabelItem | null
  ): number {

    if (!label) {
      return 0;
    }


    return label.boxes.filter(
      box =>
        box.type === 'FULL'
    ).length;
  }


  getPartialBoxCount(
    label: LabelItem | null
  ): number {

    if (!label) {
      return 0;
    }


    return label.boxes.filter(
      box =>
        box.type === 'PARTIAL'
    ).length;
  }


  /* =====================================================
     SELECTED SLOT SUMMARY
  ===================================================== */

  get selectedPallet(): PalletItem | null {

    return (
      this.selectedSlot?.pallet ||
      null
    );
  }


  get selectedSlotLabelCount(): number {

    return (
      this.selectedPallet?.labels.length ||
      0
    );
  }


  get selectedSlotBoxCount(): number {

    if (!this.selectedPallet) {
      return 0;
    }


    return this.selectedPallet
      .labels
      .reduce(
        (
          sum,
          label
        ) =>
          sum +
          label.boxes.length,
        0
      );
  }


  get selectedSlotQty(): number {

    if (!this.selectedPallet) {
      return 0;
    }


    return this.selectedPallet
      .labels
      .reduce(
        (
          sum,
          label
        ) =>
          sum +
          label.qty,
        0
      );
  }


  /* =====================================================
     OVERALL SUMMARY
  ===================================================== */

  get totalPallets(): number {

    return Object
      .keys(
        this.mockInventory
      )
      .length;
  }


  get totalLabels(): number {

    return Object
      .values(
        this.mockInventory
      )
      .reduce(
        (
          sum,
          pallet
        ) =>
          sum +
          pallet.labels.length,
        0
      );
  }


  get totalBoxes(): number {

    return Object
      .values(
        this.mockInventory
      )
      .flatMap(
        pallet =>
          pallet.labels
      )
      .reduce(
        (
          sum,
          label
        ) =>
          sum +
          label.boxes.length,
        0
      );
  }


  get totalQty(): number {

    return Object
      .values(
        this.mockInventory
      )
      .flatMap(
        pallet =>
          pallet.labels
      )
      .reduce(
        (
          sum,
          label
        ) =>
          sum +
          label.qty,
        0
      );
  }


  /* =====================================================
     RACK COLOR CLASS
  ===================================================== */

  getRackGroupClass(
    rackGroup: RackGroup
  ): string {

    switch (
      rackGroup
    ) {

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


    return this.getRackGroupClass(
      this.selectedSlot.rackGroup
    );
  }


  /* =====================================================
     TRACK BY
  ===================================================== */

  trackByRack(
    index: number,
    rack: RackDefinition
  ): string {

    return rack.name;
  }


  trackByNumber(
    index: number,
    value: number
  ): number {

    return value;
  }


  trackByLabel(
    index: number,
    label: LabelItem
  ): string {

    return label.labelId;
  }


  trackByBox(
    index: number,
    box: BoxItem
  ): string {

    return box.boxNo;
  }
}