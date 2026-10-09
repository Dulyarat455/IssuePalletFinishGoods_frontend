import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CallSocketService } from '../services/call-socket.service';



import Swal from 'sweetalert2';
import config from '../../config';

type RackGroup = 'ABC' | 'DE' | 'FGH' | 'PENDING';

type LayoutPanelMode = 'STOCK' | 'MOVE_AREA' | 'MOVE_LAYOUT';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './lay-out.component.html',
  styleUrl: './lay-out.component.css',
})
export class LayOutComponent implements OnInit {

  wsSub?: Subscription;

  constructor(
      private http: HttpClient,
      private router: Router,
      private callSocket: CallSocketService,
  ){}

  /* =====================================================
     RACK / AREA MASTER FROM API
  ===================================================== */

  @ViewChild('movePalletIdInput')
  movePalletIdInput?: ElementRef<HTMLInputElement>;

  @ViewChild('moveLabelNoInput')
  moveLabelNoInput?: ElementRef<HTMLInputElement>;

  rackDefinitions: RackDefinition[] = [];

  layoutLocations: MapLocationPalletBoxRow[] = [];

  locationByMapAreaRackId = new Map<number, MapLocationPalletBoxRow>();

  isLoadingRack = false;

  rackLoadError = '';

  selectedSlot: RackSlot | null = null;

  selectedPallet: PalletItem | null = null;

  selectedLabel: LabelItem | null = null;

  // =====================================================
  // RIGHT PANEL MODE
  // =====================================================

  panelMode: LayoutPanelMode = 'STOCK';

  // =====================================================
  // MOVE PALLET
  // =====================================================

  // Scanner Tag
  movePalletIdTag = '';

  moveLabelNoTag = '';

  // Pallet ที่ Scan เจอ
  movePallet: PalletItem | null = null;

  // Location ปัจจุบัน
  moveCurrentMapAreaRackId: number | null = null;

  // Location ปลายทาง
  moveDestinationMapAreaRackId: number | null = null;

  // State
  isMovingPallet = false;


  // =====================================================
  // MOVE PALLET BY LAYOUT
  // =====================================================

  // Location ต้นทางที่ Click
  layoutMoveSourceSlot: RackSlot | null = null;

  // Pallet ที่เลือกจาก Location ต้นทาง
  layoutMovePallet: PalletItem | null = null;

  // ยืนยัน Pallet ต้นทางแล้วหรือยัง
  layoutMoveSourceConfirmed = false;

  // Location ปลายทาง
  layoutMoveDestinationMapAreaRackId: number | null = null;


  

  ngOnInit(): void {

    this.fetchLayoutData();

    // ✅ ฟัง event จาก websocket
    this.wsSub = this.callSocket.onJobChanged().subscribe((payload: any) => {
    const type = payload?.type as 'palletLabelChange' | undefined;
     
      if(type === 'palletLabelChange'){
        this.fetchLayoutData();
      }
    })

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

  setPanelMode(
    mode: LayoutPanelMode
  ): void {
  
    // =====================================================
    // CLICK CURRENT PANEL AGAIN
    // =====================================================
  
    if (
      this.panelMode === mode
    ) {
  
      if (
        mode === 'MOVE_AREA'
      ) {
        this.focusMovePalletId();
      }
  
      return;
    }
  
  
    // =====================================================
    // SET MODE
    // =====================================================
  
    this.panelMode =
      mode;
  
  
    // =====================================================
    // CLEAR STOCK SELECT
    // =====================================================
  
    this.selectedSlot =
      null;
  
    this.selectedPallet =
      null;
  
    this.selectedLabel =
      null;
  
  
    // =====================================================
    // STOCK
    // =====================================================
  
    if (
      mode === 'STOCK'
    ) {
  
      this.resetMoveArea(
        false
      );
  
      this.resetLayoutMove();
  
      return;
    }
  
  
    // =====================================================
    // MOVE AREA : SCANNER
    // =====================================================
  
    if (
      mode === 'MOVE_AREA'
    ) {
  
      this.resetLayoutMove();
  
      this.resetMoveArea(
        false
      );
  
      this.focusMovePalletId();
  
      return;
    }
  
  
    // =====================================================
    // MOVE BY LAYOUT
    // =====================================================
  
    if (
      mode === 'MOVE_LAYOUT'
    ) {
  
      this.resetMoveArea(
        false
      );
  
      this.resetLayoutMove();
  
      return;
    }
  
  }

  resetMoveArea(
    focusPalletId: boolean = true
  ): void {
  
    this.movePalletIdTag = '';
  
    this.moveLabelNoTag = '';
  
    this.movePallet = null;
  
    this.moveCurrentMapAreaRackId =
      null;
  
    this.moveDestinationMapAreaRackId =
      null;
  
    if (
      focusPalletId
    ) {
      this.focusMovePalletId();
    }
  
  }



  resetLayoutMove(): void {

    this.layoutMoveSourceSlot =
      null;
  
    this.layoutMovePallet =
      null;
  
    this.layoutMoveSourceConfirmed =
      false;
  
    this.layoutMoveDestinationMapAreaRackId =
      null;
  
  }

  // =====================================================
  // MOVE AREA : SCAN PALLET
  // =====================================================

  onMovePalletScan(
    source:
      'AUTO' |
      'MANUAL' =
      'MANUAL'
  ): void {
  
    // =====================================================
    // SCAN VALUE
    // =====================================================
  
    const palletIdTag =
      String(
        this.movePalletIdTag ||
        ''
      )
        .trim()
        .toUpperCase();
  
  
    const labelNoTag =
      String(
        this.moveLabelNoTag ||
        ''
      )
        .trim()
        .toUpperCase();
  
  
    // =====================================================
    // VALIDATE PALLET ID
    //
    // ใช้ Pallet ID เป็นตัว Search จริงเพียงตัวเดียว
    // =====================================================
  
    if (
      !palletIdTag
    ) {
  
      Swal.fire({
  
        icon:
          'warning',
  
        title:
          'Scan Pallet',
  
        text:
          'กรุณา Scan Pallet ID',
  
        confirmButtonText:
          'OK',
  
        allowOutsideClick:
          false,
  
        allowEscapeKey:
          false,
  
        returnFocus:
          false,
  
      }).then(() => {
  
        this.focusMovePalletId();
  
      });
  
  
      return;
  
    }
  
  
    // =====================================================
    // AUTO
    //
    // Scanner Flow:
    //
    // Pallet ID
    //    ↓
    // Label No
    //    ↓
    // Search Pallet
    //
    // Label No เป็นเพียงค่าที่รับ
    // ไม่ได้ใช้ Match Pallet
    // =====================================================
  
    if (
      source ===
      'AUTO'
    ) {
  
      // ถ้ายังไม่มี Label No
      // ให้รอ Scan ช่องที่สองก่อน
      if (
        !labelNoTag
      ) {
  
        this.focusMoveLabelNo();
  
        return;
  
      }
  
    }
  
  
    // =====================================================
    // SEARCH FROM FRONTEND DATA
    //
    // IMPORTANT:
    //
    // ใช้เฉพาะ Pallet ID ที่ Scan มา
    //
    // API:
    // pallet.palletNoId
    //
    // เช่น:
    // Scan Pallet ID = 26X06004
    //
    // จะหา:
    // pallet.palletNoId === 26X06004
    // =====================================================
  
    let foundPallet:
      PalletItem |
      null =
      null;
  
  
    for (
      const location
      of this.layoutLocations
    ) {
  
      for (
        const pallet
        of location.pallets
      ) {
  
        const palletId =
          String(
            pallet.palletNoId ||
            pallet.palletId ||
            ''
          )
            .trim()
            .toUpperCase();
  
  
        // ===============================================
        // CHECK PALLET ID ONLY
        // ===============================================
  
        if (
          palletId ===
          palletIdTag
        ) {
  
          foundPallet =
            pallet;
  
          break;
  
        }
  
      }
  
  
      if (
        foundPallet
      ) {
  
        break;
  
      }
  
    }
  
  
    // =====================================================
    // NOT FOUND
    // =====================================================
  
    if (
      !foundPallet
    ) {
  
      this.movePallet =
        null;
  
      this.moveCurrentMapAreaRackId =
        null;
  
      this.moveDestinationMapAreaRackId =
        null;
  
  
      Swal.fire({
  
        icon:
          'warning',
  
        title:
          'Pallet Not Found',
  
        html: `
          <div style="text-align:left">
  
            <div>
              ไม่พบ Pallet จาก Pallet ID ที่ Scan
            </div>
  
            <div
              style="
                margin-top:12px;
                padding:10px 12px;
                border-radius:8px;
                background:#f8fafc;
                font-size:12px;
              "
            >
  
              <div>
                <b>Pallet ID:</b>
                ${
                  this.movePalletIdTag ||
                  '-'
                }
              </div>
  
              <div style="margin-top:5px">
                <b>Label No:</b>
                ${
                  this.moveLabelNoTag ||
                  '-'
                }
              </div>
  
            </div>
  
          </div>
        `,
  
        confirmButtonText:
          'OK',
  
        allowOutsideClick:
          false,
  
        allowEscapeKey:
          false,
  
        showConfirmButton:
          true,
  
        returnFocus:
          false,
  
      }).then(() => {
  
        this.resetMoveArea(
          true
        );
  
      });
  
  
      return;
  
    }
  
  
    // =====================================================
    // FOUND
    // =====================================================
  
    this.movePallet =
      foundPallet;
  
  
    this.moveCurrentMapAreaRackId =
      Number(
        foundPallet.mapAreaRackId
      );
  
  
    this.moveDestinationMapAreaRackId =
      null;
  
  
    // =====================================================
    // IMPORTANT
    //
    // ไม่เขียนทับค่าที่ Scan มา
    //
    // Pallet ID = ค่าจาก Scanner
    // Label No  = ค่าจาก Scanner
    // =====================================================
  
  
    // =====================================================
    // REMOVE FOCUS
    // =====================================================
  
    if (
      document.activeElement
      instanceof HTMLElement
    ) {
  
      document.activeElement.blur();
  
    }
  
  }

  // =====================================================
  // MOVE AREA : PALLET ID SCAN COMPLETE
  // =====================================================
  onMovePalletIdEnter(
    event?: Event
  ): void {
  
    event?.preventDefault();
  
  
    const value =
      String(
        this.movePalletIdTag ||
        ''
      ).trim();
  
  
    if (
      !value
    ) {
  
      this.focusMovePalletId();
  
      return;
  
    }
  
  
    // Pallet ID Scan เสร็จ
    // ไป Scan Label No ต่อ
  
    this.focusMoveLabelNo();
  
  }

  // =====================================================
  // MOVE AREA : PALLET NO SCAN COMPLETE
  // =====================================================

  onMoveLabelNoEnter(
    event?: Event
  ): void {
  
    event?.preventDefault();
  
  
    const palletId =
      String(
        this.movePalletIdTag ||
        ''
      ).trim();
  
  
    const labelNo =
      String(
        this.moveLabelNoTag ||
        ''
      ).trim();
  
  
    // =====================================================
    // ต้องมี Pallet ID ก่อน
    // =====================================================
  
    if (
      !palletId
    ) {
  
      this.focusMovePalletId();
  
      return;
  
    }
  
  
    // =====================================================
    // Label No เป็น Receiver
    //
    // รอให้ Scanner ใส่ค่าให้ครบก่อน
    // แต่ไม่เอาค่านี้ไป Match Pallet
    // =====================================================
  
    if (
      !labelNo
    ) {
  
      this.focusMoveLabelNo();
  
      return;
  
    }
  
  
    // =====================================================
    // AUTO SEARCH
    //
    // Search จะใช้ Pallet ID อย่างเดียว
    // =====================================================
  
    this.onMovePalletScan(
      'AUTO'
    );
  
  }

  // =====================================================
  // MOVE AREA : FOCUS
  // =====================================================

  private focusMovePalletId(): void {
    setTimeout(() => {
      const input = this.movePalletIdInput?.nativeElement;

      if (!input) {
        return;
      }

      input.focus();

      input.select();
    }, 120);
  }

  private focusMoveLabelNo(): void {

    setTimeout(() => {
  
      const input =
        this.moveLabelNoInput
          ?.nativeElement;
  
  
      if (
        !input
      ) {
        return;
      }
  
  
      input.focus();
  
      input.select();
  
    }, 80);
  
  }

  // =====================================================
  // MOVE AREA : SELECT DESTINATION
  // =====================================================

  selectMoveDestination(mapAreaRackId: number): void {
    if (!this.movePallet) {
      Swal.fire({
        icon: 'warning',

        title: 'Scan Pallet First',

        text: 'กรุณา Scan Pallet ก่อนเลือก Location ปลายทาง',
      });

      return;
    }

    const mapId = Number(mapAreaRackId);

    const location = this.locationByMapAreaRackId.get(mapId);

    if (!location) {
      return;
    }

    // =====================================================
    // CURRENT LOCATION
    // =====================================================

    if (mapId === Number(this.moveCurrentMapAreaRackId)) {
      return;
    }

    // =====================================================
    // OCCUPIED
    // =====================================================

    if (location.isPending !== true && Number(location.palletCount || 0) > 0) {
      return;
    }

    // =====================================================
    // SELECT
    // =====================================================

    this.moveDestinationMapAreaRackId = mapId;
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

  getAreaDisplayCode(areaName: string): string {
    const name = String(areaName || '').trim();

    if (name.toUpperCase() === 'PENDING') {
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
    return (
      String(rackName || '')
        .trim()
        .toUpperCase() === 'PENDING'
    );
  }

  getMainRacks(): RackDefinition[] {
    return this.rackDefinitions.filter(
      (rack) => !this.isPendingRackName(rack.name)
    );
  }

  getPendingRack(): RackDefinition | null {
    return (
      this.rackDefinitions.find((rack) => this.isPendingRackName(rack.name)) ||
      null
    );
  }

  getLeftRacks(): RackDefinition[] {
    return this.getMainRacks().filter((rack) => {
      const name = String(rack.name || '')
        .trim()
        .toUpperCase()
        .replace('RACK', '')
        .trim();

      return name === 'A' || name === 'B' || name === 'C';
    });
  }

  getRightRacks(): RackDefinition[] {
    return this.getMainRacks().filter((rack) => {
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
    });
  }

  // =====================================================
  // MOVE AREA : CURRENT LOCATION
  // =====================================================

  get moveCurrentLocation(): MapLocationPalletBoxRow | null {
    if (!this.moveCurrentMapAreaRackId) {
      return null;
    }

    return (
      this.locationByMapAreaRackId.get(Number(this.moveCurrentMapAreaRackId)) ||
      null
    );
  }

  // =====================================================
  // MOVE AREA : DESTINATION LOCATION
  // =====================================================

  get moveDestinationLocation(): MapLocationPalletBoxRow | null {
    if (!this.moveDestinationMapAreaRackId) {
      return null;
    }

    return (
      this.locationByMapAreaRackId.get(
        Number(this.moveDestinationMapAreaRackId)
      ) || null
    );
  }

  // =====================================================
  // MOVE AREA : AVAILABLE DESTINATIONS
  // =====================================================

  get moveAvailableLocations(): MapLocationPalletBoxRow[] {
    if (!this.movePallet) {
      return [];
    }

    return this.layoutLocations
      .filter((location: MapLocationPalletBoxRow) => {
        const mapId = Number(location.mapAreaRackId);

        // =================================================
        // CURRENT LOCATION
        // ห้ามเลือก Location เดิม
        // =================================================

        if (mapId === Number(this.moveCurrentMapAreaRackId)) {
          return false;
        }

        // =================================================
        // PENDING = SPECIAL CASE
        //
        // ถึงมี Pallet อยู่ก็เลือกได้
        // =================================================

        if (location.isPending === true) {
          return true;
        }

        // =================================================
        // NORMAL LOCATION
        // ต้องว่างเท่านั้น
        // =================================================

        return Number(location.palletCount || 0) === 0;
      })
      .sort((a, b) =>
        String(a.locationName || a.areaName).localeCompare(
          String(b.locationName || b.areaName),
          undefined,
          {
            numeric: true,
          }
        )
      );
  }

  /* =====================================================
     SELECT SLOT
  ===================================================== */

  selectSlot(
    slot: RackSlot
  ): void {
  
    // =====================================================
    // MOVE AREA : SCANNER MODE
    // =====================================================
  
    if (
      this.panelMode ===
      'MOVE_AREA'
    ) {
  
      if (
        !this.movePallet
      ) {
        return;
      }
  
  
      const mapId =
        Number(
          slot.mapAreaRackId
        );
  
  
      if (
        mapId ===
        Number(
          this.moveCurrentMapAreaRackId
        )
      ) {
        return;
      }
  
  
      const location =
        this.locationByMapAreaRackId.get(
          mapId
        );
  
  
      if (
        slot.pallets.length > 0 &&
        location?.isPending !== true
      ) {
        return;
      }
  
  
      this.selectMoveDestination(
        mapId
      );
  
      return;
    }
  
  
    // =====================================================
    // MOVE BY LAYOUT
    // =====================================================
  
    if (
      this.panelMode ===
      'MOVE_LAYOUT'
    ) {
  
      const mapId =
        Number(
          slot.mapAreaRackId
        );
  
  
      const location =
        this.locationByMapAreaRackId.get(
          mapId
        );
  
  
      if (
        !location
      ) {
        return;
      }
  
  
      // ===================================================
      // STEP 1
      // SELECT SOURCE
      // ===================================================
  
      if (
        !this.layoutMoveSourceConfirmed
      ) {
  
        // ต้องเป็น Area ที่มี Pallet เท่านั้น
        if (
          slot.pallets.length <= 0
        ) {
          return;
        }
  
  
        this.layoutMoveSourceSlot =
          slot;
  
  
        // Clear Destination ทุกครั้ง
        this.layoutMoveDestinationMapAreaRackId =
          null;
  
  
        // ===============================================
        // ถ้ามี Pallet เดียว
        // เลือกให้อัตโนมัติ
        // ===============================================
  
        if (
          slot.pallets.length === 1
        ) {
  
          this.layoutMovePallet =
            slot.pallets[0];
  
        } else {
  
          // หลาย Pallet
          // ให้ User เลือกเองจาก Panel
          this.layoutMovePallet =
            null;
  
        }
  
  
        return;
      }
  
  
      // ===================================================
      // STEP 2
      // SELECT DESTINATION
      // ===================================================
  
      if (
        !this.layoutMoveSourceSlot ||
        !this.layoutMovePallet
      ) {
        return;
      }
  
  
      // ห้ามเลือก Location ต้นทางเดิม
      if (
        mapId ===
        Number(
          this.layoutMoveSourceSlot
            .mapAreaRackId
        )
      ) {
        return;
      }
  
  
     // ===================================================
      // DESTINATION
      //
      // NORMAL LOCATION
      // -> ต้องว่างเท่านั้น
      //
      // PENDING
      // -> ถึงมี Pallet อยู่แล้วก็เลือกได้
      // ===================================================
  
      if (
        location.isPending !== true &&
        (
          Number(
            location.palletCount || 0
          ) > 0 ||
          slot.pallets.length > 0
        )
      ) {
        return;
      }
  
  
      this.layoutMoveDestinationMapAreaRackId =
        mapId;
  
  
      return;
    }
  
  
    // =====================================================
    // STOCK MODE เดิม
    // =====================================================
  
    this.selectedSlot =
      slot;
  
  
    this.selectedPallet =
      slot.pallets.length > 0
        ? slot.pallets[0]
        : null;
  
  
    if (
      this.selectedPallet &&
      this.selectedPallet.labels.length > 0
    ) {
  
      this.selectedLabel =
        this.selectedPallet.labels[0];
  
    } else {
  
      this.selectedLabel =
        null;
  
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




  selectLayoutMovePallet(
    pallet: PalletItem
  ): void {
  
    if (
      this.layoutMoveSourceConfirmed
    ) {
      return;
    }
  
  
    this.layoutMovePallet =
      pallet;
  
  }


  

  // =====================================================
  // MOVE AREA : SOURCE
  // =====================================================

  isMoveSource(area: AreaRow): boolean {
    return (
      this.panelMode === 'MOVE_AREA' &&
      this.moveCurrentMapAreaRackId != null &&
      Number(area.mapAreaRackId) === Number(this.moveCurrentMapAreaRackId)
    );
  }

  // =====================================================
  // MOVE AREA : TARGET
  // =====================================================

  isMoveTarget(area: AreaRow): boolean {
    return (
      this.panelMode === 'MOVE_AREA' &&
      this.moveDestinationMapAreaRackId != null &&
      Number(area.mapAreaRackId) === Number(this.moveDestinationMapAreaRackId)
    );
  }

  // =====================================================
  // MOVE AREA : OCCUPIED
  // =====================================================

  isMoveOccupied(area: AreaRow): boolean {
    if (this.panelMode !== 'MOVE_AREA') {
      return false;
    }

    const location = this.locationByMapAreaRackId.get(
      Number(area.mapAreaRackId)
    );

    if (!location) {
      return false;
    }

    // =====================================================
    // SOURCE
    // =====================================================

    if (this.isMoveSource(area)) {
      return false;
    }

    // =====================================================
    // PENDING
    //
    // Special Case:
    // ถึงมี Pallet ก็ไม่ Lock / ไม่เทา
    // =====================================================

    if (location.isPending === true) {
      return false;
    }

    // =====================================================
    // NORMAL LOCATION
    // =====================================================

    return Number(location.palletCount || 0) > 0;
  }

  // =====================================================
  // EDIT ACTUAL PALLET
  // =====================================================

  editActualPallet(): void {
    if (!this.selectedPallet || !this.selectedPallet.id) {
      Swal.fire({
        icon: 'warning',
        title: 'No Pallet Selected',
        text: 'กรุณาเลือก Pallet ก่อน',
      });

      return;
    }

    this.router.navigate(['/issue'], {
      state: {
        fromLayout: true,

        mode: 'ACTUAL_PALLET',

        palletId: Number(this.selectedPallet.id),

        palletNoId: this.selectedPallet.palletNoId,

        mapAreaRackId: this.selectedPallet.mapAreaRackId,
      },
    });
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

  confirmMovePallet(): void {
    if (!this.movePallet) {
      return;
    }

    const palletId = Number(this.movePallet.id);

    const destinationId = Number(this.moveDestinationMapAreaRackId || 0);

    if (
      !Number.isInteger(palletId) ||
      palletId <= 0 ||
      !Number.isInteger(destinationId) ||
      destinationId <= 0
    ) {
      Swal.fire({
        icon: 'warning',

        title: 'ข้อมูลไม่ครบ',

        text: 'กรุณาเลือก Pallet และ Location ปลายทาง',
      });

      return;
    }

    if (this.isMovingPallet) {
      return;
    }

    const fromName =
      this.moveCurrentLocation?.locationName ||
      this.moveCurrentLocation?.areaName ||
      '-';

    const toName =
      this.moveDestinationLocation?.locationName ||
      this.moveDestinationLocation?.areaName ||
      '-';

    Swal.fire({
      icon: 'question',

      title: 'Move Pallet ?',

      html: `
        <div style="text-align:left">
  
          <div>
            <b>Pallet:</b>
            ${this.movePallet.palletNoId}
          </div>
  
          <div style="margin-top:8px">
            <b>From:</b>
            ${fromName}
          </div>
  
          <div style="margin-top:8px">
            <b>To:</b>
            ${toName}
          </div>
  
        </div>
      `,

      showCancelButton: true,

      confirmButtonText: 'Move Pallet',

      cancelButtonText: 'Cancel',

      confirmButtonColor: '#2563eb',

      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.callMovePallet(palletId, destinationId);
    });
  }


  confirmLayoutMoveSource(): void {

    if (
      !this.layoutMoveSourceSlot ||
      !this.layoutMovePallet
    ) {
  
      Swal.fire({
        icon: 'warning',
        title: 'Select Pallet',
        text: 'กรุณาเลือก Pallet ที่ต้องการย้าย',
      });
  
      return;
    }
  
  
    const sourceName =
      this.layoutMoveSourceLocation
        ?.locationName ||
      this.layoutMoveSourceLocation
        ?.areaName ||
      '-';
  
  
    Swal.fire({
  
      icon:
        'question',
  
      title:
        'Confirm Pallet ?',
  
      html: `
        <div style="text-align:left">
  
          <div
            style="
              padding:12px;
              border-radius:10px;
              background:#f8fafc;
              border:1px solid #e2e8f0;
            "
          >
  
            <div>
              <span
                style="
                  color:#64748b;
                  font-size:11px;
                  font-weight:800;
                "
              >
                PALLET ID
              </span>
  
              <div
                style="
                  margin-top:3px;
                  font-size:20px;
                  font-weight:950;
                  color:#0f172a;
                "
              >
                ${this.layoutMovePallet.palletNoId}
              </div>
            </div>
  
  
            <div
              style="
                margin-top:10px;
                font-size:12px;
              "
            >
              <b>Current Location:</b>
              ${sourceName}
            </div>
  
          </div>
  
  
          <div
            style="
              margin-top:10px;
              color:#64748b;
              font-size:12px;
            "
          >
            หลังจากยืนยัน ให้เลือก Location ปลายทางที่ว่างจาก Rack Layout
          </div>
  
        </div>
      `,
  
      showCancelButton:
        true,
  
      confirmButtonText:
        'Confirm Pallet',
  
      cancelButtonText:
        'Cancel',
  
      confirmButtonColor:
        '#2563eb',
  
      cancelButtonColor:
        '#64748b',
  
      reverseButtons:
        true,
  
    }).then((result) => {
  
      if (
        !result.isConfirmed
      ) {
        return;
      }
  
  
      this.layoutMoveSourceConfirmed =
        true;
  
  
      this.layoutMoveDestinationMapAreaRackId =
        null;
  
    });
  
  }



  confirmLayoutMovePallet(): void {

    if (
      !this.layoutMoveSourceConfirmed ||
      !this.layoutMoveSourceSlot ||
      !this.layoutMovePallet
    ) {
  
      Swal.fire({
        icon: 'warning',
        title: 'Pallet Not Confirmed',
        text: 'กรุณาเลือกและยืนยัน Pallet ก่อน',
      });
  
      return;
    }
  
  
    const palletId =
      Number(
        this.layoutMovePallet.id
      );
  
  
    const destinationId =
      Number(
        this.layoutMoveDestinationMapAreaRackId ||
        0
      );
  
  
    if (
      !Number.isInteger(palletId) ||
      palletId <= 0 ||
      !Number.isInteger(destinationId) ||
      destinationId <= 0
    ) {
  
      Swal.fire({
        icon: 'warning',
        title: 'Select Destination',
        text: 'กรุณาเลือก Location ปลายทาง',
      });
  
      return;
    }
  
  
    if (
      this.isMovingPallet
    ) {
      return;
    }
  
  
    // =====================================================
    // CHECK DESTINATION AGAIN
    // =====================================================
  
    const destination =
      this.locationByMapAreaRackId.get(
        destinationId
      );
  
  
      if (
        !destination
      ) {
      
        Swal.fire({
          icon: 'warning',
          title: 'Location Not Found',
          text: 'ไม่พบ Location ปลายทาง',
        });
      
        return;
      }
      
      
      // =====================================================
      // NORMAL LOCATION
      //
      // มี Pallet อยู่แล้ว = ห้าม Move
      //
      // PENDING
      // มี Pallet อยู่แล้ว = อนุญาต
      // =====================================================
      
      if (
        destination.isPending !== true &&
        Number(
          destination.palletCount ||
          0
        ) > 0
      ) {
      
        Swal.fire({
          icon: 'warning',
          title: 'Location ไม่ว่าง',
          text: 'Location ปลายทางมี Pallet อยู่แล้ว',
        });
      
        return;
      }
  
  
    const fromName =
      this.layoutMoveSourceLocation
        ?.locationName ||
      this.layoutMoveSourceLocation
        ?.areaName ||
      '-';
  
  
    const toName =
      this.layoutMoveDestinationLocation
        ?.locationName ||
      this.layoutMoveDestinationLocation
        ?.areaName ||
      '-';
  
  
    Swal.fire({
  
      icon:
        'question',
  
      title:
        'Move Pallet ?',
  
      html: `
        <div style="text-align:left">
  
          <div
            style="
              padding:12px;
              border-radius:10px;
              background:#f8fafc;
              border:1px solid #e2e8f0;
            "
          >
  
            <div>
              <b>Pallet:</b>
              ${this.layoutMovePallet.palletNoId}
            </div>
  
  
            <div
              style="
                margin-top:10px;
                display:grid;
                grid-template-columns:1fr auto 1fr;
                gap:10px;
                align-items:center;
                text-align:center;
              "
            >
  
              <div>
                <span
                  style="
                    display:block;
                    color:#64748b;
                    font-size:10px;
                  "
                >
                  FROM
                </span>
  
                <b>
                  ${fromName}
                </b>
              </div>
  
  
              <div
                style="
                  color:#2563eb;
                  font-size:18px;
                "
              >
                →
              </div>
  
  
              <div>
                <span
                  style="
                    display:block;
                    color:#64748b;
                    font-size:10px;
                  "
                >
                  TO
                </span>
  
                <b>
                  ${toName}
                </b>
              </div>
  
            </div>
  
          </div>
  
        </div>
      `,
  
      showCancelButton:
        true,
  
      confirmButtonText:
        'Move Pallet',
  
      cancelButtonText:
        'Cancel',
  
      confirmButtonColor:
        '#2563eb',
  
      cancelButtonColor:
        '#64748b',
  
      reverseButtons:
        true,
  
    }).then((result) => {
  
      if (
        !result.isConfirmed
      ) {
        return;
      }
  
  
      this.callMovePallet(
        palletId,
        destinationId,
        this.layoutMovePallet?.palletNoId,
        'LAYOUT'
      );
  
    });
  
  }



  private callMovePallet(
    palletId: number,
    mapAreaRackId: number,
    palletNoOverride: string = '',
    sourceMode: 'SCAN' | 'LAYOUT' = 'SCAN'
  ): void {
    this.isMovingPallet = true;

    Swal.fire({
      title: 'Moving Pallet...',

      text: 'กำลังเปลี่ยน Location ของ Pallet',

      allowOutsideClick: false,

      allowEscapeKey: false,

      showConfirmButton: false,

      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.http
      .post<any>(config.apiServer + '/api/location/movePallet', {
        palletId: palletId,

        mapAreaRackId: mapAreaRackId,
      })
      .subscribe({
        // =================================================
        // SUCCESS
        // =================================================

        next: (res: any): void => {
          this.isMovingPallet = false;

          const palletNo =
          String(
            res?.data?.palletNoId ||
            palletNoOverride ||
            this.movePallet?.palletNoId ||
            ''
          );

          Swal.fire({
            icon: 'success',

            title: 'Move Pallet Success',

            html: `
              <div>
                Pallet
                <b>${palletNo}</b>
                ถูกย้ายเรียบร้อยแล้ว
              </div>
            `,

            timer: 1200,

            showConfirmButton: false,
          }).then(() => {
            if (
              sourceMode === 'LAYOUT'
            ) {
            
              this.resetLayoutMove();
            
            } else {
            
              this.resetMoveArea();
            
            }
            
            
            this.fetchLayoutData();
          });
        },

        // =================================================
        // ERROR
        // =================================================

        error: (err: any): void => {
          this.isMovingPallet = false;

          const msg = String(
            err?.error?.message || err?.error?.error || err?.message || ''
          );

          if (msg === 'area_already_occupied') {
            Swal.fire({
              icon: 'warning',

              title: 'Location ไม่ว่าง',

              text: 'มี Pallet อยู่ใน Location นี้แล้ว',
            });

            // โหลด Layout ใหม่
            // เผื่อมีคนอื่นเพิ่ง Move เข้ามา
            this.fetchLayoutData();

            return;
          }

          if (msg === 'same_map_area_rack') {
            Swal.fire({
              icon: 'warning',

              title: 'Location เดิม',

              text: 'Pallet อยู่ใน Location นี้อยู่แล้ว',
            });

            return;
          }

          if (msg === 'Pallet_notFound') {
            Swal.fire({
              icon: 'warning',

              title: 'Pallet Not Found',

              text: 'ไม่พบ Pallet นี้ในระบบ',
            });

            return;
          }

          if (msg === 'map_area_rack_notFound') {
            Swal.fire({
              icon: 'warning',

              title: 'Location Not Found',

              text: 'ไม่พบ Location ปลายทาง',
            });

            return;
          }

          Swal.fire({
            icon: 'error',

            title: 'Move Pallet Failed',

            text: msg || 'ไม่สามารถ Move Pallet ได้',
          });
        },
      });
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




  get layoutMoveSourceLocation():
  MapLocationPalletBoxRow | null {

  if (
    !this.layoutMoveSourceSlot
  ) {
    return null;
  }


  return (
    this.locationByMapAreaRackId.get(
      Number(
        this.layoutMoveSourceSlot
          .mapAreaRackId
      )
    ) ||
    null
  );

}


get layoutMoveDestinationLocation():
  MapLocationPalletBoxRow | null {

  if (
    this.layoutMoveDestinationMapAreaRackId ==
    null
  ) {
    return null;
  }


  return (
    this.locationByMapAreaRackId.get(
      Number(
        this.layoutMoveDestinationMapAreaRackId
      )
    ) ||
    null
  );

}




isLayoutMoveSource(
  area: AreaRow
): boolean {

  return (
    this.panelMode ===
      'MOVE_LAYOUT' &&

    this.layoutMoveSourceSlot !=
      null &&

    Number(
      area.mapAreaRackId
    ) ===
      Number(
        this.layoutMoveSourceSlot
          .mapAreaRackId
      )
  );

}


isLayoutMoveTarget(
  area: AreaRow
): boolean {

  return (
    this.panelMode ===
      'MOVE_LAYOUT' &&

    this.layoutMoveDestinationMapAreaRackId !=
      null &&

    Number(
      area.mapAreaRackId
    ) ===
      Number(
        this.layoutMoveDestinationMapAreaRackId
      )
  );

}


isLayoutMoveEmptyCandidate(
  area: AreaRow
): boolean {

  if (
    this.panelMode !==
      'MOVE_LAYOUT' ||
    !this.layoutMoveSourceConfirmed
  ) {
    return false;
  }


  const location =
    this.locationByMapAreaRackId.get(
      Number(
        area.mapAreaRackId
      )
    );


  if (
    !location
  ) {
    return false;
  }


  // Source เดิม
  // ห้ามเลือกซ้ำ
  if (
    this.isLayoutMoveSource(
      area
    )
  ) {
    return false;
  }


  // Pending เลือกได้เสมอ
  if (
    location.isPending === true
  ) {
    return true;
  }


  // Normal Location ต้องว่าง
  return (
    Number(
      location.palletCount ||
      0
    ) === 0
  );

}


isLayoutMoveLocked(
  area: AreaRow
): boolean {

  if (
    this.panelMode !==
    'MOVE_LAYOUT'
  ) {
    return false;
  }


  const location =
    this.locationByMapAreaRackId.get(
      Number(
        area.mapAreaRackId
      )
    );


  if (
    !location
  ) {
    return true;
  }


  // =====================================================
  // BEFORE CONFIRM SOURCE
  //
  // ต้องเลือก Area ที่มี Pallet เป็น Source
  // =====================================================

  if (
    !this.layoutMoveSourceConfirmed
  ) {

    return (
      Number(
        location.palletCount ||
        0
      ) === 0
    );

  }


  // =====================================================
  // SOURCE
  // =====================================================

  if (
    this.isLayoutMoveSource(
      area
    )
  ) {
    return false;
  }


  // =====================================================
  // PENDING
  //
  // ถึงมี Pallet อยู่แล้วก็ไม่ Lock
  // =====================================================

  if (
    location.isPending === true
  ) {
    return false;
  }


  // =====================================================
  // NORMAL LOCATION
  //
  // Occupied = Lock
  // =====================================================

  return (
    Number(
      location.palletCount ||
      0
    ) > 0
  );

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


  ngOnDestroy() {
    this.wsSub?.unsubscribe();
  }


}
