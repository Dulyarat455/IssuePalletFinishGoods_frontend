import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';
import config from '../../config';


type PalletBoxRow = {
  id: number;
  headerId: number;
  headerClosedId: number | null;

  itemNo: string;
  itemName: string;

  wosNo: string;
  dwg: string;
  dieNo: string;
  lotNo: string;

  qty: number;

  timeStmp: string;
  status: string;

  isFraction: boolean;
  boxType: 'NORMAL' | 'FRACTION';
};


type PalletHeaderRow = {
  id: number;
  palletId: number;

  itemNo: string;
  itemName: string;

  normalQty: number;
  fractionQty: number;

  groupId: number;

  controlLot: string;
  moveMentThreeMonth: string;

  userId: number;

  timeStmp: string;
  status: string;

  totalBox: number;
  normalBox: number;
  fractionBox: number;
  totalQty: number;

  boxes: PalletBoxRow[];
};


type PalletDashboardRow = {
  id: number;

  palletNoId: string;

  date: string;
  shift: string;

  mapAreaRackId: number;

  labelType: string;

  userId: number;

  timeStmp: string;

  totalHeader: number;
  totalBox: number;
  normalBox: number;
  fractionBox: number;
  totalQty: number;

  headers: PalletHeaderRow[];
};


type DashboardSummary = {
  totalPallet: number;
  totalHeader: number;
  totalBox: number;
  normalBox: number;
  fractionBox: number;
  totalQty: number;
};


type DashboardFilter = {
  dateFrom: string;
  dateTo: string;
  keyword: string;
  shift: string;
  labelType: string;
};


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl:
    './dashboard.component.html',
  styleUrl:
    './dashboard.component.css',
})
export class DashboardComponent
  implements OnInit
{

  // =====================================================
  // DATA
  // =====================================================

  palletsAll:
    PalletDashboardRow[] = [];

  pallets:
    PalletDashboardRow[] = [];


  summary:
    DashboardSummary = {
      totalPallet: 0,
      totalHeader: 0,
      totalBox: 0,
      normalBox: 0,
      fractionBox: 0,
      totalQty: 0,
    };


  // =====================================================
  // FILTER
  // =====================================================

  filters:
    DashboardFilter =
      this.createDefaultFilters();


  // =====================================================
  // EXPAND
  // =====================================================

  expandedPalletIds =
    new Set<number>();

  expandedHeaderIds =
    new Set<number>();


  // =====================================================
  // STATE
  // =====================================================

  isLoading = false;


  constructor(
    private http: HttpClient
  ) {}


  ngOnInit(): void {

    this.fetchPallet();

  }


  // =====================================================
  // FETCH PALLET
  // =====================================================

  fetchPallet(): void {

    if (this.isLoading) {
      return;
    }


    this.isLoading =
      true;


    this.http
      .get<any>(
        config.apiServer +
          '/api/issue/listPallet',
        {}
      )
      .subscribe({

        next: (res: any) => {

          this.isLoading =
            false;


          const rows =
            Array.isArray(
              res?.results
            )
              ? res.results
              : [];


          this.palletsAll =
            rows.map(
              (row: any) =>
                this.normalizePallet(
                  row
                )
            );


          this.summary = {

            totalPallet:
              Number(
                res?.summary
                  ?.totalPallet || 0
              ),

            totalHeader:
              Number(
                res?.summary
                  ?.totalHeader || 0
              ),

            totalBox:
              Number(
                res?.summary
                  ?.totalBox || 0
              ),

            normalBox:
              Number(
                res?.summary
                  ?.normalBox || 0
              ),

            fractionBox:
              Number(
                res?.summary
                  ?.fractionBox || 0
              ),

            totalQty:
              Number(
                res?.summary
                  ?.totalQty || 0
              ),

          };


          this.applyFilters();


          // เปิด Pallet ล่าสุดให้อัตโนมัติ
          if (
            this.pallets.length > 0
          ) {

            this.expandedPalletIds
              .add(
                this.pallets[0].id
              );

          }

        },


        error: (err) => {

          console.error(
            err
          );


          this.isLoading =
            false;


          Swal.fire({

            icon:
              'error',

            title:
              'Load Dashboard ไม่สำเร็จ',

            text:
              err?.error?.message ||
              err?.error?.error ||
              err?.message ||
              'Fetch Pallet fail',

          });

        },

      });

  }


  // =====================================================
  // NORMALIZE
  // =====================================================

  private normalizePallet(
    raw: any
  ): PalletDashboardRow {

    const headers:
      PalletHeaderRow[] =
      Array.isArray(raw?.headers)
        ? raw.headers.map(
            (header: any) =>
              this.normalizeHeader(
                header
              )
          )
        : [];


    return {

      id:
        Number(raw?.id),

      palletNoId:
        String(
          raw?.palletNoId || '-'
        ),

      date:
        String(
          raw?.date || ''
        ),

      shift:
        String(
          raw?.shift || '-'
        ),

      mapAreaRackId:
        Number(
          raw?.mapAreaRackId || 0
        ),

      labelType:
        String(
          raw?.labelType || '-'
        ),

      userId:
        Number(
          raw?.userId || 0
        ),

      timeStmp:
        String(
          raw?.timeStmp || ''
        ),

      totalHeader:
        Number(
          raw?.totalHeader || 0
        ),

      totalBox:
        Number(
          raw?.totalBox || 0
        ),

      normalBox:
        Number(
          raw?.normalBox || 0
        ),

      fractionBox:
        Number(
          raw?.fractionBox || 0
        ),

      totalQty:
        Number(
          raw?.totalQty || 0
        ),

      headers:
        headers,

    };

  }


  private normalizeHeader(
    raw: any
  ): PalletHeaderRow {

    const boxes:
      PalletBoxRow[] =
      Array.isArray(raw?.boxes)
        ? raw.boxes.map(
            (box: any) =>
              this.normalizeBox(
                box
              )
          )
        : [];


    return {

      id:
        Number(raw?.id),

      palletId:
        Number(
          raw?.palletId
        ),

      itemNo:
        String(
          raw?.itemNo || '-'
        ),

      itemName:
        String(
          raw?.itemName || '-'
        ),

      normalQty:
        Number(
          raw?.normalQty || 0
        ),

      fractionQty:
        Number(
          raw?.fractionQty || 0
        ),

      groupId:
        Number(
          raw?.groupId || 0
        ),

      controlLot:
        String(
          raw?.controlLot || ''
        ),

      moveMentThreeMonth:
        String(
          raw?.moveMentThreeMonth ||
          '-'
        ),

      userId:
        Number(
          raw?.userId || 0
        ),

      timeStmp:
        String(
          raw?.timeStmp || ''
        ),

      status:
        String(
          raw?.status || ''
        ),

      totalBox:
        Number(
          raw?.totalBox || 0
        ),

      normalBox:
        Number(
          raw?.normalBox || 0
        ),

      fractionBox:
        Number(
          raw?.fractionBox || 0
        ),

      totalQty:
        Number(
          raw?.totalQty || 0
        ),

      boxes:
        boxes,

    };

  }


  private normalizeBox(
    raw: any
  ): PalletBoxRow {

    return {

      id:
        Number(raw?.id),

      headerId:
        Number(
          raw?.headerId
        ),

      headerClosedId:
        raw?.headerClosedId == null
          ? null
          : Number(
              raw.headerClosedId
            ),

      itemNo:
        String(
          raw?.itemNo || '-'
        ),

      itemName:
        String(
          raw?.itemName || '-'
        ),

      wosNo:
        String(
          raw?.wosNo || '-'
        ),

      dwg:
        String(
          raw?.dwg || '-'
        ),

      dieNo:
        String(
          raw?.dieNo || '-'
        ),

      lotNo:
        String(
          raw?.lotNo || '-'
        ),

      qty:
        Number(
          raw?.qty || 0
        ),

      timeStmp:
        String(
          raw?.timeStmp || ''
        ),

      status:
        String(
          raw?.status || ''
        ),

      isFraction:
        Boolean(
          raw?.isFraction
        ),

      boxType:
        raw?.isFraction
          ? 'FRACTION'
          : 'NORMAL',

    };

  }


  // =====================================================
  // FILTER
  // =====================================================

  createDefaultFilters():
    DashboardFilter {

    return {

      dateFrom:
        '',

      dateTo:
        '',

      keyword:
        '',

      shift:
        'ALL',

      labelType:
        'ALL',

    };

  }


  applyFilters(): void {

    const keyword =
      this.norm(
        this.filters.keyword
      );


    this.pallets =
      this.palletsAll.filter(
        (pallet) => {


          // ===============================================
          // DATE FROM
          // ===============================================

          const palletDate =
            this.toYmd(
              pallet.date
            );


          if (
            this.filters.dateFrom &&
            palletDate <
              this.filters.dateFrom
          ) {

            return false;

          }


          // ===============================================
          // DATE TO
          // ===============================================

          if (
            this.filters.dateTo &&
            palletDate >
              this.filters.dateTo
          ) {

            return false;

          }


          // ===============================================
          // SHIFT
          // ===============================================

          if (
            this.filters.shift !==
              'ALL' &&
            pallet.shift !==
              this.filters.shift
          ) {

            return false;

          }


          // ===============================================
          // LABEL TYPE
          // ===============================================

          if (
            this.filters.labelType !==
              'ALL' &&
            pallet.labelType !==
              this.filters.labelType
          ) {

            return false;

          }


          // ===============================================
          // KEYWORD
          // ===============================================

          if (!keyword) {

            return true;

          }


          let searchText = `

            ${pallet.palletNoId}

            ${pallet.shift}

            ${pallet.labelType}

            ${pallet.mapAreaRackId}

          `;


          for (
            const header
            of pallet.headers
          ) {

            searchText += `

              ${header.itemNo}

              ${header.itemName}

              ${header.controlLot}

              ${header.moveMentThreeMonth}

            `;


            for (
              const box
              of header.boxes
            ) {

              searchText += `

                ${box.wosNo}

                ${box.itemNo}

                ${box.itemName}

                ${box.dwg}

                ${box.dieNo}

                ${box.lotNo}

              `;

            }

          }


          return this
            .norm(searchText)
            .includes(keyword);

        }
      );

  }


  resetFilters(): void {

    this.filters =
      this.createDefaultFilters();


    this.applyFilters();

  }


  // =====================================================
  // EXPAND PALLET
  // =====================================================

  togglePallet(
    palletId: number
  ): void {

    if (
      this.expandedPalletIds.has(
        palletId
      )
    ) {

      this.expandedPalletIds.delete(
        palletId
      );

      return;

    }


    this.expandedPalletIds.add(
      palletId
    );

  }


  isPalletExpanded(
    palletId: number
  ): boolean {

    return this.expandedPalletIds.has(
      palletId
    );

  }


  // =====================================================
  // EXPAND HEADER
  // =====================================================

  toggleHeader(
    headerId: number
  ): void {

    if (
      this.expandedHeaderIds.has(
        headerId
      )
    ) {

      this.expandedHeaderIds.delete(
        headerId
      );

      return;

    }


    this.expandedHeaderIds.add(
      headerId
    );

  }


  isHeaderExpanded(
    headerId: number
  ): boolean {

    return this.expandedHeaderIds.has(
      headerId
    );

  }


  // =====================================================
  // OPEN ALL HEADER
  // =====================================================

  expandAllHeaders(
    pallet: PalletDashboardRow
  ): void {

    pallet.headers.forEach(
      (header) => {

        this.expandedHeaderIds.add(
          header.id
        );

      }
    );

  }


  collapseAllHeaders(
    pallet: PalletDashboardRow
  ): void {

    pallet.headers.forEach(
      (header) => {

        this.expandedHeaderIds.delete(
          header.id
        );

      }
    );

  }


  // =====================================================
  // UTIL
  // =====================================================

  formatDate(
    value: string
  ): string {

    if (!value) {
      return '-';
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return value;

    }


    return date
      .toLocaleDateString(
        'en-GB'
      );

  }


  formatDateTime(
    value: string
  ): string {

    if (!value) {
      return '-';
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return value;

    }


    return date
      .toLocaleString(
        'en-GB'
      );

  }


  private toYmd(
    value: string
  ): string {

    if (!value) {
      return '';
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return '';

    }


    const y =
      date.getFullYear();


    const m =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        '0'
      );


    const d =
      String(
        date.getDate()
      ).padStart(
        2,
        '0'
      );


    return `${y}-${m}-${d}`;

  }


  private norm(
    value: string
  ): string {

    return String(
      value || ''
    )
      .trim()
      .toUpperCase();

  }

}