import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

import Swal from 'sweetalert2';
import config from '../../config';

type RackGroup = 'ABC' | 'DE' | 'FGH' | 'PENDING';

type BoxType = 'FULL' | 'PARTIAL';

type BoxItem = {
  boxId: number;

  boxNo: string;

  wosNo: string;

  lotNo: string;

  qty: number;

  dieNo: string;

  dwg: string;

  itemNo: string;

  itemName: string;

  type: BoxType;
};

type LabelItem = {
  headerId: number;

  labelId: string;

  itemNo: string;

  itemName: string;

  dieNo: string;

  oqcLotNo: string;

  qty: number;

  fullBoxCount: number;

  partialBoxCount: number;

  boxes: BoxItem[];
};

type PalletItem = {
  id: number;

  palletId: string;

  palletNoId: string;

  receivedDate: string;

  shift: string;

  labelType: string;

  mapAreaRackId: number;

  qty: number;

  labels: LabelItem[];
};

type AreaRow = {
  areaId: number;

  areaName: string;

  mapAreaRackId: number;
};

type RackSlot = {
  rackId: number;

  areaId: number;

  mapAreaRackId: number;

  rack: string;

  code: string;

  displayCode: string;

  rackGroup: RackGroup;

  pallets: PalletItem[];

  pallet: PalletItem | null;
};

type RackDefinition = {
  rackId: number;

  name: string;

  rackGroup: RackGroup;

  areas: AreaRow[];
};

type MapLocationPalletBoxRow = {
  mapAreaRackId: number;

  rackId: number;

  areaId: number;

  rackName: string;

  areaName: string;

  locationName: string;

  isPending: boolean;

  isOccupied: boolean;

  isEmpty: boolean;

  palletCount: number;

  pallets: PalletItem[];
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

  layoutLocations: MapLocationPalletBoxRow[] = [];

  locationByMapAreaRackId = new Map<number, MapLocationPalletBoxRow>();

  isLoadingRack = false;

  rackLoadError = '';

  selectedSlot: RackSlot | null = null;

  selectedPallet: PalletItem | null = null;

  selectedLabel: LabelItem | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchLayoutData();
  }

  /* =====================================================
     LOAD RACK / AREA
  ===================================================== */

  fetchLayoutData(): void {
    this.isLoadingRack = true;

    this.rackLoadError = '';

    this.http
      .get<any>(config.apiServer + '/api/location/mapLocationPalletBox')
      .subscribe({
        next: (res: any): void => {
          const rows = Array.isArray(res?.results) ? res.results : [];

          // =================================================
          // NORMALIZE API DATA
          // =================================================

          this.layoutLocations = rows.map(
            (row: any): MapLocationPalletBoxRow => {
              const pallets: PalletItem[] = Array.isArray(row?.pallets)
                ? row.pallets.map(
                    (pallet: any): PalletItem => ({
                      id: Number(pallet.id),

                      palletId: String(
                        pallet.palletId || pallet.palletNoId || ''
                      ),

                      palletNoId: String(
                        pallet.palletNoId || pallet.palletId || ''
                      ),

                      receivedDate: this.formatApiDate(
                        pallet.receivedDate || pallet.date
                      ),

                      shift: String(pallet.shift || ''),

                      labelType: String(pallet.labelType || ''),

                      mapAreaRackId: Number(pallet.mapAreaRackId),

                      qty: Number(pallet.qty || 0),

                      labels: Array.isArray(pallet.labels)
                        ? pallet.labels.map(
                            (label: any): LabelItem => ({
                              headerId: Number(label.headerId),

                              labelId: String(
                                label.labelId || label.labelNo || ''
                              ),

                              itemNo: String(label.itemNo || ''),

                              itemName: String(label.itemName || ''),

                              dieNo: String(label.dieNo || ''),

                              oqcLotNo: String(
                                label.oqcLotNo || label.controlLot || ''
                              ),

                              qty: Number(label.qty || 0),

                              fullBoxCount: Number(label.fullBoxCount || 0),

                              partialBoxCount: Number(
                                label.partialBoxCount || 0
                              ),

                              boxes: Array.isArray(label.boxes)
                                ? label.boxes.map(
                                    (box: any): BoxItem => ({
                                      boxId: Number(box.boxId),

                                      boxNo: String(
                                        box.boxNo ||
                                          box.wosNo ||
                                          box.boxId ||
                                          ''
                                      ),

                                      wosNo: String(box.wosNo || ''),

                                      lotNo: String(box.lotNo || ''),

                                      qty: Number(box.qty || 0),

                                      dieNo: String(box.dieNo || ''),

                                      dwg: String(box.dwg || ''),

                                      itemNo: String(box.itemNo || ''),

                                      itemName: String(box.itemName || ''),

                                      type:
                                        String(box.type || 'FULL')
                                          .trim()
                                          .toUpperCase() === 'PARTIAL'
                                          ? 'PARTIAL'
                                          : 'FULL',
                                    })
                                  )
                                : [],
                            })
                          )
                        : [],
                    })
                  )
                : [];

              return {
                mapAreaRackId: Number(row.mapAreaRackId),

                rackId: Number(row.rackId),

                areaId: Number(row.areaId),

                rackName: String(row.rackName || '').trim(),

                areaName: String(row.areaName || '').trim(),

                locationName: String(row.locationName || '').trim(),

                isPending: row.isPending === true,

                isOccupied: pallets.length > 0,

                isEmpty: pallets.length === 0,

                palletCount: pallets.length,

                pallets: pallets,
              };
            }
          );

          // =================================================
          // LOCATION MAP
          // =================================================

          this.locationByMapAreaRackId = new Map<
            number,
            MapLocationPalletBoxRow
          >();

          for (const location of this.layoutLocations) {
            this.locationByMapAreaRackId.set(
              Number(location.mapAreaRackId),

              location
            );
          }

          // =================================================
          // BUILD RACK DEFINITIONS
          // =================================================

          const rackMap = new Map<number, RackDefinition>();

          for (const location of this.layoutLocations) {
            const rackId = Number(location.rackId);

            if (!rackMap.has(rackId)) {
              rackMap.set(rackId, {
                rackId: rackId,

                name: location.rackName,

                rackGroup: this.getRackGroupByName(location.rackName),

                areas: [],
              });
            }

            rackMap.get(rackId)!.areas.push({
              areaId: Number(location.areaId),

              areaName: location.areaName,

              mapAreaRackId: Number(location.mapAreaRackId),
            });
          }

          // =================================================
          // SORT
          // =================================================

          this.rackDefinitions = Array.from(rackMap.values())
            .map(
              (rack): RackDefinition => ({
                ...rack,

                areas: [...rack.areas].sort((a, b) =>
                  this.compareAreaName(a.areaName, b.areaName)
                ),
              })
            )
            .sort((a, b) =>
              String(a.name).localeCompare(String(b.name), undefined, {
                numeric: true,
              })
            );

          // =================================================
          // RESET SELECT
          // =================================================

          this.selectedSlot = null;

          this.selectedPallet = null;

          this.selectedLabel = null;

          this.isLoadingRack = false;
        },

        error: (err: any): void => {
          console.error('Load Layout Error:', err);

          this.layoutLocations = [];

          this.rackDefinitions = [];

          this.locationByMapAreaRackId = new Map<
            number,
            MapLocationPalletBoxRow
          >();

          this.selectedSlot = null;

          this.selectedPallet = null;

          this.selectedLabel = null;

          this.isLoadingRack = false;

          this.rackLoadError =
            err?.error?.error ||
            err?.error?.message ||
            err?.message ||
            'Load rack inventory fail';

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

    if (name === 'PENDING') {
      return 'PENDING';
    }

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

  formatApiDate(value: any): string {
    if (!value) {
      return '-';
    }

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
      return String(value);
    }

    const yyyy = d.getFullYear();

    const mm = String(d.getMonth() + 1).padStart(2, '0');

    const dd = String(d.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }

  /* =====================================================
     GROUP AREA INTO VISUAL ROWS

     101 201 301 401 501
     102 202 302 402 502
     ...
  ===================================================== */

  getAreaDisplayCode(
    areaName: string
  ): string {
  
    const name =
      String(
        areaName || ''
      ).trim();
  
    if (
      name.toUpperCase() === 'PENDING'
    ) {
      return 'Pending';
    }
  
    return name;
  }


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

  getSlot(rack: RackDefinition, area: AreaRow): RackSlot {
    const location =
      this.locationByMapAreaRackId.get(Number(area.mapAreaRackId)) || null;

    const pallets = location?.pallets || [];

    const isPending =
      String(rack.name || '')
        .trim()
        .toUpperCase() === 'PENDING';

    const displayCode = isPending
      ? 'Pending'
      : String(area.areaName || '').trim();

    return {
      rackId: Number(rack.rackId),

      areaId: Number(area.areaId),

      mapAreaRackId: Number(area.mapAreaRackId),

      rack: rack.name,

      code:
        location?.locationName ||
        (isPending ? 'Pending' : `${rack.name}${displayCode}`),

      displayCode: displayCode,

      rackGroup: rack.rackGroup,

      pallets: pallets,

      pallet: pallets.length > 0 ? pallets[0] : null,
    };
  }


  isPendingRackName(rackName: string): boolean {
    return String(rackName || '').trim().toUpperCase() === 'PENDING';
  }
  
  getMainRacks(): RackDefinition[] {
    return this.rackDefinitions.filter(
      rack => !this.isPendingRackName(rack.name)
    );
  }
  
  getPendingRack(): RackDefinition | null {
    return (
      this.rackDefinitions.find(
        rack => this.isPendingRackName(rack.name)
      ) || null
    );
  }



  getLeftRacks(): RackDefinition[] {
    return this.getMainRacks().filter(
      (rack) => {
        const name = String(rack.name || '')
          .trim()
          .toUpperCase()
          .replace('RACK', '')
          .trim();
  
        return (
          name === 'A' ||
          name === 'B' ||
          name === 'C'
        );
      }
    );
  }
  
  
  getRightRacks(): RackDefinition[] {
    return this.getMainRacks().filter(
      (rack) => {
        const name = String(rack.name || '')
          .trim()
          .toUpperCase()
          .replace('RACK', '')
          .trim();
  
        return (
          name === 'D' ||
          name === 'E' ||
          name === 'F' ||
          name === 'G' ||
          name === 'H'
        );
      }
    );
  }








  /* =====================================================
     SELECT SLOT
  ===================================================== */

  selectSlot(slot: RackSlot): void {
    this.selectedSlot = slot;

    this.selectedPallet = slot.pallets.length > 0 ? slot.pallets[0] : null;

    if (this.selectedPallet && this.selectedPallet.labels.length > 0) {
      this.selectedLabel = this.selectedPallet.labels[0];
    } else {
      this.selectedLabel = null;
    }
  }

  selectPallet(pallet: PalletItem): void {
    this.selectedPallet = pallet;

    if (pallet.labels.length > 0) {
      this.selectedLabel = pallet.labels[0];
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
    const location = this.locationByMapAreaRackId.get(
      Number(area.mapAreaRackId)
    );

    return Number(location?.palletCount || 0) > 0;
  }

  /* =====================================================
     LABEL COUNT
  ===================================================== */

  getLabelCount(rack: RackDefinition, area: AreaRow): number {
    const location = this.locationByMapAreaRackId.get(
      Number(area.mapAreaRackId)
    );

    if (!location) {
      return 0;
    }

    return location.pallets.reduce(
      (sum, pallet) => sum + pallet.labels.length,
      0
    );
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

  get selectedSlotPalletCount(): number {
    return this.selectedSlot?.pallets.length || 0;
  }

  get selectedSlotLabelCount(): number {
    if (!this.selectedSlot) {
      return 0;
    }

    return this.selectedSlot.pallets.reduce(
      (sum, pallet) => sum + pallet.labels.length,
      0
    );
  }

  get selectedSlotBoxCount(): number {
    if (!this.selectedSlot) {
      return 0;
    }

    return this.selectedSlot.pallets
      .flatMap((pallet) => pallet.labels)
      .reduce((sum, label) => sum + label.boxes.length, 0);
  }

  get selectedSlotQty(): number {
    if (!this.selectedSlot) {
      return 0;
    }

    return this.selectedSlot.pallets.reduce(
      (sum, pallet) => sum + Number(pallet.qty || 0),
      0
    );
  }

  /* =====================================================
     OVERALL SUMMARY
  ===================================================== */

  get totalPallets(): number {
    return this.layoutLocations.reduce(
      (sum, location) => sum + location.pallets.length,
      0
    );
  }

  get totalLabels(): number {
    return this.layoutLocations
      .flatMap((location) => location.pallets)
      .reduce((sum, pallet) => sum + pallet.labels.length, 0);
  }

  get totalBoxes(): number {
    return this.layoutLocations
      .flatMap((location) => location.pallets)
      .flatMap((pallet) => pallet.labels)
      .reduce((sum, label) => sum + label.boxes.length, 0);
  }

  get totalQty(): number {
    return this.layoutLocations
      .flatMap((location) => location.pallets)
      .reduce((sum, pallet) => sum + Number(pallet.qty || 0), 0);
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

      case 'PENDING':
        return 'rack-group-pending';

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
