import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';
import config from '../../config';

type PartMasterRow = {
  id: number;
  itemNo: string;
  itemName: string;
  itemClass?: string | null;
  lotSize?: number | null;
  timeStmp?: string | null;
  status?: string | null;
};

type SyncPbassResponse = {
  message?: string;

  totalFromPbass?: number;
  validRows?: number;
  uniqueRows?: number;

  createdCount?: number;
  updatedCount?: number;
  skippedCount?: number;

  invalidItemNoCount?: number;
  filteredItemClassCount?: number;
  duplicateInPayloadCount?: number;

  requestUrl?: string;
  currentYear?: number;
  targetYear?: number;

  chunkSize?: number;
  totalFindChunks?: number;
  totalCreateChunks?: number;
  totalUpdateChunks?: number;
};

@Component({
  selector: 'app-item-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './item-master.component.html',
  styleUrl: './item-master.component.css'
})
export class ItemMasterComponent implements OnInit {

  rows: PartMasterRow[] = [];
  filteredRows: PartMasterRow[] = [];

  isLoading = false;
  isSyncing = false;

  searchItemNo = '';
  searchItemName = '';
  searchItemClass = '';
  searchLotSize = '';

  constructor(
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.fetchData();
  }

  /* =====================================================
     FETCH DATA
  ===================================================== */
  fetchData(): void {
    this.isLoading = true;
  
    this.http
      .get<any>(
        config.apiServer +
        '/api/partMaster/list'
      )
      .subscribe({
        next: (res) => {
          const data: PartMasterRow[] =
            Array.isArray(res?.results)
              ? res.results
              : [];
  
          const classOrder: Record<string, number> = {
            G: 1,
            L: 2,
            S: 3
          };
  
          this.rows = data.sort((a, b) => {
            const classA =
              String(a.itemClass || '').toUpperCase();
  
            const classB =
              String(b.itemClass || '').toUpperCase();
  
            const orderA =
              classOrder[classA] ?? 99;
  
            const orderB =
              classOrder[classB] ?? 99;
  
            // 1. Sort ตาม Item Class
            if (orderA !== orderB) {
              return orderA - orderB;
            }
  
            // 2. ถ้า Class เดียวกัน Sort Item No.
            return String(a.itemNo || '').localeCompare(
              String(b.itemNo || ''),
              undefined,
              {
                numeric: true,
                sensitivity: 'base'
              }
            );
          });
  
          this.applyFilter();
  
          this.isLoading = false;
        },
  
        error: (err) => {
          this.isLoading = false;
  
          Swal.fire({
            title: 'Load Data Failed',
            text:
              err?.error?.error ||
              err?.error?.message ||
              err?.message ||
              'Cannot load Part Master',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#14b89a'
          });
        }
      });
  }

  /* =====================================================
     FILTER
  ===================================================== */

  applyFilter(): void {
    const itemNo =
      this.searchItemNo
        .trim()
        .toLowerCase();

    const itemName =
      this.searchItemName
        .trim()
        .toLowerCase();

    const itemClass =
      this.searchItemClass
        .trim()
        .toUpperCase();

    const lotSize =
      this.searchLotSize
        .trim()
        .toLowerCase();

    this.filteredRows =
      this.rows.filter(row => {

        const rowItemNo =
          String(
            row.itemNo ?? ''
          ).toLowerCase();

        const rowItemName =
          String(
            row.itemName ?? ''
          ).toLowerCase();

        const rowItemClass =
          String(
            row.itemClass ?? ''
          ).toUpperCase();

        const rowLotSize =
          row.lotSize == null
            ? ''
            : String(
                row.lotSize
              ).toLowerCase();

        return (
          (!itemNo ||
            rowItemNo.includes(itemNo)) &&

          (!itemName ||
            rowItemName.includes(itemName)) &&

          (!itemClass ||
            rowItemClass === itemClass) &&

          (!lotSize ||
            rowLotSize.includes(lotSize))
        );
      });
  }

  /* =====================================================
     CLEAR FILTER
  ===================================================== */

  clearFilter(): void {
    this.searchItemNo = '';
    this.searchItemName = '';
    this.searchItemClass = '';
    this.searchLotSize = '';

    this.applyFilter();
  }

  /* =====================================================
     SUMMARY
  ===================================================== */

  get totalGeneral(): number {
    return this.rows.filter(
      row =>
        String(
          row.itemClass || ''
        ).toUpperCase() === 'G'
    ).length;
  }

  get totalLamination(): number {
    return this.rows.filter(
      row =>
        String(
          row.itemClass || ''
        ).toUpperCase() === 'L'
    ).length;
  }

  get totalStator(): number {
    return this.rows.filter(
      row =>
        String(
          row.itemClass || ''
        ).toUpperCase() === 'S'
    ).length;
  }

  /* =====================================================
     ADD ITEM
  ===================================================== */

  addItem(): void {
    if (this.isSyncing) {
      return;
    }

    Swal.fire({
      width: 430,
      icon: 'info',
      title: 'Add Item',
      text: 'Add Item function is not available yet.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#14b89a'
    });
  }

  /* =====================================================
     SYNC PBASS
  ===================================================== */

  syncPbass(): void {
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    /* ===================================================
       LOADING MODAL
       STYLE อยู่ใน function ทั้งหมด
    =================================================== */

    Swal.fire({
      width: 440,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            padding: 8px 8px 4px;
            text-align: center;
          "
        >

          <div
            style="
              width: 74px;
              height: 74px;
              margin: 0 auto 18px;
              position: relative;
            "
          >

            <div
              style="
                width: 74px;
                height: 74px;
                position: absolute;
                inset: 0;

                border: 6px solid #dff6f1;
                border-top-color: #14b89a;
                border-radius: 50%;

                box-sizing: border-box;

                animation:
                  pbass-spin 0.8s linear infinite;
              "
            ></div>


            <div
              style="
                position: absolute;
                inset: 0;

                display: flex;
                align-items: center;
                justify-content: center;

                color: #0b987f;

                font-size: 27px;
                font-weight: 900;
              "
            >
              ↻
            </div>

          </div>


          <div
            style="
              color: #172033;
              font-size: 21px;
              font-weight: 800;
            "
          >
            Synchronizing PBASS
          </div>


          <div
            style="
              margin-top: 9px;

              color: #435267;

              font-size: 14px;
              font-weight: 600;
            "
          >
            กำลัง Sync ข้อมูล Item Master
          </div>


          <div
            style="
              margin-top: 7px;

              color: #8792a3;

              font-size: 12px;
              line-height: 1.5;
            "
          >
            Please wait while the system retrieves
            and updates master data from PBASS.
          </div>


          <div
            style="
              margin-top: 17px;

              padding: 10px 12px;

              background: #f3faf8;

              border: 1px solid #d5ebe5;
              border-radius: 7px;

              color: #64776f;

              font-size: 11px;
            "
          >
            Please do not close or refresh this page.
          </div>


          <style>

            @keyframes pbass-spin {

              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }

            }

          </style>

        </div>
      `
    });

    /* ===================================================
       CALL API
    =================================================== */

    this.http
      .get<SyncPbassResponse>(
        config.apiServer +
        '/api/partMaster/syncMasterPbass'
      )
      .subscribe({
        next: (res) => {
          this.isSyncing = false;

          Swal.close();

          const totalFromPbass =
            Number(
              res?.totalFromPbass || 0
            );

          const validRows =
            Number(
              res?.validRows || 0
            );

          const createdCount =
            Number(
              res?.createdCount || 0
            );

          const updatedCount =
            Number(
              res?.updatedCount || 0
            );

          const skippedCount =
            Number(
              res?.skippedCount || 0
            );

          /* =================================================
             RESULT MODAL
          ================================================= */

          Swal.fire({
            width: 540,

            showConfirmButton: true,

            confirmButtonText: 'Done',

            confirmButtonColor: '#14b89a',

            allowOutsideClick: false,

            html: `
              <div
                style="
                  font-family: Arial, sans-serif;
                  text-align: left;
                  padding: 2px 3px 0;
                "
              >

                <!-- HEADER -->

                <div
                  style="
                    display: flex;
                    align-items: center;
                    gap: 13px;

                    padding-bottom: 15px;

                    border-bottom:
                      1px solid #e6ecef;
                  "
                >

                  <div
                    style="
                      width: 46px;
                      height: 46px;

                      flex: 0 0 46px;

                      display: flex;
                      align-items: center;
                      justify-content: center;

                      border-radius: 50%;

                      background: #ddf7ee;

                      color: #0a9a7e;

                      font-size: 23px;
                      font-weight: 900;
                    "
                  >
                    ✓
                  </div>


                  <div>

                    <div
                      style="
                        color: #152033;

                        font-size: 19px;
                        font-weight: 800;
                      "
                    >
                      PBASS Sync Completed
                    </div>


                    <div
                      style="
                        margin-top: 4px;

                        color: #8994a3;

                        font-size: 11px;
                      "
                    >
                      Item Master synchronization completed successfully.
                    </div>

                  </div>

                </div>


                <!-- PBASS / FILTER -->

                <div
                  style="
                    display: grid;

                    grid-template-columns:
                      1fr 1fr;

                    gap: 10px;

                    margin-top: 15px;
                  "
                >

                  <div
                    style="
                      padding: 13px 14px;

                      border:
                        1px solid #dce5e8;

                      border-radius: 8px;

                      background: #f8fafb;
                    "
                  >

                    <div
                      style="
                        color: #6f7c8e;

                        font-size: 10px;
                        font-weight: 800;
                      "
                    >
                      PBASS DATA
                    </div>


                    <div
                      style="
                        margin-top: 5px;

                        color: #162136;

                        font-size: 25px;
                        font-weight: 900;
                      "
                    >
                      ${totalFromPbass.toLocaleString('en-US')}
                    </div>

                  </div>


                  <div
                    style="
                      padding: 13px 14px;

                      border:
                        1px solid #ccebe3;

                      border-radius: 8px;

                      background: #f0faf7;
                    "
                  >

                    <div
                      style="
                        color: #4d7c70;

                        font-size: 10px;
                        font-weight: 800;
                      "
                    >
                      AFTER ITEM CLASS FILTER
                    </div>


                    <div
                      style="
                        margin-top: 5px;

                        color: #126c5a;

                        font-size: 25px;
                        font-weight: 900;
                      "
                    >
                      ${validRows.toLocaleString('en-US')}
                    </div>

                  </div>

                </div>


                <!-- ACTION -->

                <div
                  style="
                    display: grid;

                    grid-template-columns:
                      repeat(3, 1fr);

                    gap: 9px;

                    margin-top: 10px;
                  "
                >

                  <!-- CREATE -->

                  <div
                    style="
                      padding: 12px;

                      border:
                        1px solid #c8ead4;

                      border-radius: 8px;

                      background: #eaf8ef;
                    "
                  >

                    <div
                      style="
                        color: #347c50;

                        font-size: 10px;
                        font-weight: 800;
                      "
                    >
                      CREATED
                    </div>


                    <div
                      style="
                        margin-top: 5px;

                        color: #21643d;

                        font-size: 22px;
                        font-weight: 900;
                      "
                    >
                      ${createdCount.toLocaleString('en-US')}
                    </div>

                  </div>


                  <!-- UPDATE -->

                  <div
                    style="
                      padding: 12px;

                      border:
                        1px solid #c9ddf5;

                      border-radius: 8px;

                      background: #eaf3ff;
                    "
                  >

                    <div
                      style="
                        color: #3972aa;

                        font-size: 10px;
                        font-weight: 800;
                      "
                    >
                      UPDATED
                    </div>


                    <div
                      style="
                        margin-top: 5px;

                        color: #285a8e;

                        font-size: 22px;
                        font-weight: 900;
                      "
                    >
                      ${updatedCount.toLocaleString('en-US')}
                    </div>

                  </div>


                  <!-- SKIP -->

                  <div
                    style="
                      padding: 12px;

                      border:
                        1px solid #dfe3e8;

                      border-radius: 8px;

                      background: #f4f5f7;
                    "
                  >

                    <div
                      style="
                        color: #707984;

                        font-size: 10px;
                        font-weight: 800;
                      "
                    >
                      SKIPPED
                    </div>


                    <div
                      style="
                        margin-top: 5px;

                        color: #555e68;

                        font-size: 22px;
                        font-weight: 900;
                      "
                    >
                      ${skippedCount.toLocaleString('en-US')}
                    </div>

                  </div>

                </div>

              </div>
            `
          })
          .then(() => {
            this.fetchData();
          });
        },

        error: (err) => {
          this.isSyncing = false;

          Swal.close();

          Swal.fire({
            width: 450,

            title:
              'PBASS Sync Failed',

            text:
              err?.error?.error ||
              err?.error?.message ||
              err?.message ||
              'Cannot synchronize Part Master from PBASS',

            icon:
              'error',

            confirmButtonText:
              'OK',

            confirmButtonColor:
              '#d9534f',

            allowOutsideClick:
              false
          });
        }
      });
  }

  /* =====================================================
     ITEM CLASS DISPLAY
  ===================================================== */

  getItemClassName(
    itemClass?: string | null
  ): string {

    switch (
      String(
        itemClass || ''
      ).toUpperCase()
    ) {

      case 'G':
        return 'General';

      case 'L':
        return 'Lamination';

      case 'S':
        return 'Stator';

      default:
        return '-';
    }
  }

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  formatDate(
    value?: string | null
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
      return '-';
    }

    return date.toLocaleString(
      'en-GB',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  }

  /* =====================================================
     TRACK BY
  ===================================================== */

  trackById(
    index: number,
    row: PartMasterRow
  ): number {

    return row.id;
  }
}