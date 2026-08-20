import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type RackColor =
  | 'lam'
  | 'gen-stator-2nd'
  | 'gen-stator-pc';

type BoxItem = {
  boxNo: string;
  lotNo: string;
  qty: number;
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
  status: 'FULL' | 'PARTIAL';
  labels: LabelItem[];
};

type RackSlot = {
  rack: string;
  code: string;
  displayCode: string;
  colorType: RackColor;
  pallets: PalletItem[];
};

type RackDefinition = {
  name: string;
  colorType: RackColor;
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

     จาก Layout ตัวอย่าง
  ===================================================== */

  rackDefinitions: RackDefinition[] = [
    {
      name: 'Rack A',
      colorType: 'lam',
      columns: [1, 2, 3, 4, 5],
      rows: 15
    },
    {
      name: 'Rack B',
      colorType: 'lam',
      columns: [1, 2, 3, 4, 5],
      rows: 15
    },
    {
      name: 'Rack C',
      colorType: 'lam',
      columns: [1, 2, 3, 4, 5],
      rows: 15
    },
    {
      name: 'Rack D',
      colorType: 'gen-stator-2nd',
      columns: [1, 2, 3, 4, 5],
      rows: 12
    },
    {
      name: 'Rack E',
      colorType: 'gen-stator-2nd',
      columns: [1, 2, 3],
      rows: 12
    },
    {
      name: 'Rack F',
      colorType: 'gen-stator-pc',
      columns: [1, 2],
      rows: 12
    },
    {
      name: 'Rack G',
      colorType: 'gen-stator-pc',
      columns: [1, 2, 3, 4],
      rows: 12
    },
    {
      name: 'Rack H',
      colorType: 'gen-stator-pc',
      columns: [1, 2, 3],
      rows: 12
    }
  ];


  /* =====================================================
     MOCK INVENTORY
  ===================================================== */

  mockInventory: Record<string, PalletItem[]> = {

    /* =============================
       Rack A
    ============================== */

    'Rack A-101': [
      {
        palletId: '26801001',
        receivedDate: '2026-08-11',
        status: 'FULL',
        labels: [
          {
            labelId: '26801004',
            itemNo: '2605025005E',
            itemName: '99TL-PL35L024-VLA6',
            dieNo: 'B0595',
            oqcLotNo: 'S67258',
            qty: 2400,
            boxes: [
              {
                boxNo: 'BOX-001',
                lotNo: '24X24',
                qty: 1000
              },
              {
                boxNo: 'BOX-002',
                lotNo: '24X24',
                qty: 1000
              },
              {
                boxNo: 'BOX-003',
                lotNo: '24X24',
                qty: 400
              }
            ]
          },
          {
            labelId: '26801005',
            itemNo: '2605025010A',
            itemName: '31ST-PL35L-024-1Y-2-CAR-D2',
            dieNo: 'P1078',
            oqcLotNo: 'S67259',
            qty: 1800,
            boxes: [
              {
                boxNo: 'BOX-004',
                lotNo: '24X25',
                qty: 1000
              },
              {
                boxNo: 'BOX-005',
                lotNo: '24X25',
                qty: 800
              }
            ]
          }
        ]
      },

      {
        palletId: '26801011',
        receivedDate: '2026-08-12',
        status: 'PARTIAL',
        labels: [
          {
            labelId: '26801012',
            itemNo: '2605025005E',
            itemName: '99TL-PL35L024-VLA6',
            dieNo: 'B0595',
            oqcLotNo: 'S67260',
            qty: 1500,
            boxes: [
              {
                boxNo: 'BOX-006',
                lotNo: '24X27',
                qty: 1000
              },
              {
                boxNo: 'BOX-007',
                lotNo: '24X27',
                qty: 500
              }
            ]
          }
        ]
      }
    ],


    'Rack A-201': [
      {
        palletId: '26802001',
        receivedDate: '2026-08-13',
        status: 'FULL',
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
                qty: 1000
              },
              {
                boxNo: 'BOX-102',
                lotNo: '25A01',
                qty: 1000
              },
              {
                boxNo: 'BOX-103',
                lotNo: '25A01',
                qty: 1000
              }
            ]
          }
        ]
      }
    ],


    'Rack B-305': [
      {
        palletId: '26803001',
        receivedDate: '2026-08-14',
        status: 'PARTIAL',
        labels: [
          {
            labelId: '26803002',
            itemNo: '3102040007B',
            itemName: 'LAMINATION CORE',
            dieNo: 'L9012',
            oqcLotNo: 'S68120',
            qty: 900,
            boxes: [
              {
                boxNo: 'BOX-201',
                lotNo: '25B11',
                qty: 500
              },
              {
                boxNo: 'BOX-202',
                lotNo: '25B11',
                qty: 400
              }
            ]
          }
        ]
      }
    ],


    'Rack D-401': [
      {
        palletId: '26804001',
        receivedDate: '2026-08-15',
        status: 'FULL',
        labels: [
          {
            labelId: '26804002',
            itemNo: '4201023001C',
            itemName: 'STATOR COMPONENT',
            dieNo: 'S3301',
            oqcLotNo: 'S68200',
            qty: 5000,
            boxes: [
              {
                boxNo: 'BOX-301',
                lotNo: '25C20',
                qty: 1000
              },
              {
                boxNo: 'BOX-302',
                lotNo: '25C20',
                qty: 1000
              },
              {
                boxNo: 'BOX-303',
                lotNo: '25C20',
                qty: 1000
              },
              {
                boxNo: 'BOX-304',
                lotNo: '25C20',
                qty: 1000
              },
              {
                boxNo: 'BOX-305',
                lotNo: '25C20',
                qty: 1000
              }
            ]
          }
        ]
      }
    ],


    'Rack F-202': [
      {
        palletId: '26805001',
        receivedDate: '2026-08-17',
        status: 'FULL',
        labels: [
          {
            labelId: '26805002',
            itemNo: '5501001120A',
            itemName: 'GENERATOR CORE',
            dieNo: 'G5100',
            oqcLotNo: 'S69010',
            qty: 2000,
            boxes: [
              {
                boxNo: 'BOX-401',
                lotNo: '26D01',
                qty: 1000
              },
              {
                boxNo: 'BOX-402',
                lotNo: '26D01',
                qty: 1000
              }
            ]
          }
        ]
      }
    ]
  };


  /* =====================================================
     STATE
  ===================================================== */

  selectedSlot: RackSlot | null = null;

  selectedPallet: PalletItem | null = null;

  selectedLabel: LabelItem | null = null;


  /* =====================================================
     BUILD SLOT CODE

     column = 1
     row    = 1

     => 101

     column = 2
     row    = 5

     => 205
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

      colorType:
        rack.colorType,

      pallets:
        this.mockInventory[key] || []
    };
  }


  /* =====================================================
     RACK ROW ARRAY
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


    this.selectedPallet =
      slot.pallets.length > 0
        ? slot.pallets[0]
        : null;


    this.selectedLabel =
      this.selectedPallet?.labels?.length
        ? this.selectedPallet.labels[0]
        : null;
  }


  /* =====================================================
     SELECT PALLET
  ===================================================== */

  selectPallet(
    pallet: PalletItem
  ): void {

    this.selectedPallet =
      pallet;


    this.selectedLabel =
      pallet.labels.length > 0
        ? pallet.labels[0]
        : null;
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
     PALLET COUNT
  ===================================================== */

  getPalletCount(
    rack: RackDefinition,
    column: number,
    row: number
  ): number {

    return this
      .getSlot(
        rack,
        column,
        row
      )
      .pallets
      .length;
  }


  /* =====================================================
     SLOT HAS DATA
  ===================================================== */

  hasInventory(
    rack: RackDefinition,
    column: number,
    row: number
  ): boolean {

    return (
      this.getPalletCount(
        rack,
        column,
        row
      ) > 0
    );
  }


  /* =====================================================
     SELECTED SLOT
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
     SUMMARY
  ===================================================== */

  get totalPallets(): number {

    return Object
      .values(
        this.mockInventory
      )
      .reduce(
        (
          sum,
          pallets
        ) =>
          sum +
          pallets.length,
        0
      );
  }


  get totalLabels(): number {

    return Object
      .values(
        this.mockInventory
      )
      .flat()
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
      .flat()
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
      .flat()
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
     SLOT SUMMARY
  ===================================================== */

  get selectedSlotLabelCount(): number {

    if (!this.selectedSlot) {
      return 0;
    }


    return this.selectedSlot
      .pallets
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


  get selectedSlotBoxCount(): number {

    if (!this.selectedSlot) {
      return 0;
    }


    return this.selectedSlot
      .pallets
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


  get selectedSlotQty(): number {

    if (!this.selectedSlot) {
      return 0;
    }


    return this.selectedSlot
      .pallets
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


  trackByPallet(
    index: number,
    pallet: PalletItem
  ): string {

    return pallet.palletId;
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