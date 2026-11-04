import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';
import config from '../../config';

type SpecialCodeRow = {
  id: number;
  specialCodeName: string;
  partMasterId: number;
  timeStmp?: string | null;
  status?: string | null;
};

type PartMasterRow = {
  id: number;
  itemNo: string;
  itemName: string;
  itemClass?: string | null;
  lotSize?: number | null;
  timeStmp?: string | null;
  status?: string | null;
  // Special Code ที่ Map เข้ามาจากอีก API
  specialCodes?: SpecialCodeRow[];
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
  imports: [CommonModule, FormsModule],
  templateUrl: './item-master.component.html',
  styleUrl: './item-master.component.css',
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
  }

  /* =====================================================
     FETCH DATA
  ===================================================== */
  fetchData(): void {
    this.isLoading = true;

    // =====================================================
    // 1. LOAD PART MASTER
    // =====================================================

    this.http.get<any>(config.apiServer + '/api/partMaster/list').subscribe({
      next: (res) => {
        const data: PartMasterRow[] = Array.isArray(res?.results)
          ? res.results
          : [];

        // =================================================
        // 2. LOAD SPECIAL CODE
        // =================================================

        this.http
          .get<any>(
            config.apiServer + '/api/partMaster/getMapSpecialCodePartModel'
          )
          .subscribe({
            next: (specialRes) => {
              const specialRows: SpecialCodeRow[] = Array.isArray(
                specialRes?.results
              )
                ? specialRes.results
                : [];

              // ===========================================
              // GROUP SPECIAL CODE BY partMasterId
              // ===========================================

              const specialCodeMap = new Map<number, SpecialCodeRow[]>();

              for (const special of specialRows) {
                const partMasterId = Number(special.partMasterId);

                if (!specialCodeMap.has(partMasterId)) {
                  specialCodeMap.set(partMasterId, []);
                }

                specialCodeMap.get(partMasterId)!.push(special);
              }

              // ===========================================
              // MAP INTO PART MASTER ROW
              // ===========================================

              const mappedData: PartMasterRow[] = data.map((row) => ({
                ...row,

                specialCodes: specialCodeMap.get(Number(row.id)) || [],
              }));

              // ===========================================
              // SORT เดิม
              // ===========================================

              const classOrder: Record<string, number> = {
                G: 1,
                L: 2,
                S: 3,
              };

              this.rows = mappedData.sort((a, b) => {
                const classA = String(a.itemClass || '').toUpperCase();

                const classB = String(b.itemClass || '').toUpperCase();

                const orderA = classOrder[classA] ?? 99;

                const orderB = classOrder[classB] ?? 99;

                if (orderA !== orderB) {
                  return orderA - orderB;
                }

                return String(a.itemNo || '').localeCompare(
                  String(b.itemNo || ''),
                  undefined,
                  {
                    numeric: true,
                    sensitivity: 'base',
                  }
                );
              });

              this.applyFilter();

              this.isLoading = false;
            },

            error: (err) => {
              this.isLoading = false;

              Swal.fire({
                title: 'Load Special Code Failed',

                text:
                  err?.error?.error ||
                  err?.error?.message ||
                  err?.message ||
                  'Cannot load Special Code',

                icon: 'error',

                confirmButtonText: 'OK',

                confirmButtonColor: '#14b89a',
              });
            },
          });
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

          confirmButtonColor: '#14b89a',
        });
      },
    });
  }

  /* =====================================================
     FILTER
  ===================================================== */

  applyFilter(): void {
    const itemNo = this.searchItemNo.trim().toLowerCase();

    const itemName = this.searchItemName.trim().toLowerCase();

    const itemClass = this.searchItemClass.trim().toUpperCase();

    const lotSize = this.searchLotSize.trim().toLowerCase();

    this.filteredRows = this.rows.filter((row) => {
      const rowItemNo = String(row.itemNo ?? '').toLowerCase();

      const rowItemName = String(row.itemName ?? '').toLowerCase();

      const rowItemClass = String(row.itemClass ?? '').toUpperCase();

      const rowLotSize =
        row.lotSize == null ? '' : String(row.lotSize).toLowerCase();

      return (
        (!itemNo || rowItemNo.includes(itemNo)) &&
        (!itemName || rowItemName.includes(itemName)) &&
        (!itemClass || rowItemClass === itemClass) &&
        (!lotSize || rowLotSize.includes(lotSize))
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
      (row) => String(row.itemClass || '').toUpperCase() === 'G'
    ).length;
  }

  get totalLamination(): number {
    return this.rows.filter(
      (row) => String(row.itemClass || '').toUpperCase() === 'L'
    ).length;
  }

  get totalStator(): number {
    return this.rows.filter(
      (row) => String(row.itemClass || '').toUpperCase() === 'S'
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
      width: 560,
      title: 'Add Item Master',
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      showCancelButton: true,
      confirmButtonColor: '#14b89a',
      cancelButtonColor: '#6c757d',
      allowOutsideClick: false,

      html: `
        <div style="
          font-family: Arial, sans-serif;
          text-align: left;
          padding: 5px 8px 0;
        ">
  
          <div style="margin-bottom:14px;">
            <label style="
              display:block;
              margin-bottom:6px;
              font-size:12px;
              font-weight:700;
              color:#374151;
            ">
              Item No. <span style="color:#dc3545;">*</span>
            </label>
  
            <input
              id="swal-item-no"
              class="swal2-input"
              placeholder="Enter Item No."
              style="
                width:100%;
                height:40px;
                margin:0;
                padding:8px 11px;
                font-size:13px;
                border:1px solid #ced4da;
                border-radius:6px;
                box-sizing:border-box;
              "
            />
          </div>
  
          <div style="margin-bottom:14px;">
            <label style="
              display:block;
              margin-bottom:6px;
              font-size:12px;
              font-weight:700;
              color:#374151;
            ">
              Item Name <span style="color:#dc3545;">*</span>
            </label>
  
            <input
              id="swal-item-name"
              class="swal2-input"
              placeholder="Enter Item Name"
              style="
                width:100%;
                height:40px;
                margin:0;
                padding:8px 11px;
                font-size:13px;
                border:1px solid #ced4da;
                border-radius:6px;
                box-sizing:border-box;
              "
            />
          </div>
  
          <div style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:12px;
          ">
  
            <div>
              <label style="
                display:block;
                margin-bottom:6px;
                font-size:12px;
                font-weight:700;
                color:#374151;
              ">
                Item Class <span style="color:#dc3545;">*</span>
              </label>
  
              <select
                id="swal-item-class"
                style="
                  width:100%;
                  height:40px;
                  padding:8px 11px;
                  font-size:13px;
                  border:1px solid #ced4da;
                  border-radius:6px;
                  background:#fff;
                  box-sizing:border-box;
                "
              >
                <option value="">-- Select Item Class --</option>
                <option value="G">General</option>
                <option value="L">Lamination</option>
                <option value="S">Stator</option>
              </select>
            </div>
  
            <div>
              <label style="
                display:block;
                margin-bottom:6px;
                font-size:12px;
                font-weight:700;
                color:#374151;
              ">
                Lot Size <span style="color:#dc3545;">*</span>
              </label>
  
              <input
                id="swal-lot-size"
                type="number"
                min="0"
                placeholder="Enter Lot Size"
                style="
                  width:100%;
                  height:40px;
                  padding:8px 11px;
                  font-size:13px;
                  border:1px solid #ced4da;
                  border-radius:6px;
                  box-sizing:border-box;
                "
              />
            </div>
  
          </div>
  
        </div>
      `,

      preConfirm: () => {
        const itemNo = (
          document.getElementById('swal-item-no') as HTMLInputElement
        )?.value?.trim();

        const itemName = (
          document.getElementById('swal-item-name') as HTMLInputElement
        )?.value?.trim();

        const itemClass = (
          document.getElementById('swal-item-class') as HTMLSelectElement
        )?.value;

        const lotSize = (
          document.getElementById('swal-lot-size') as HTMLInputElement
        )?.value;

        if (!itemNo || !itemName || !itemClass || lotSize === '') {
          Swal.showValidationMessage('Please fill in all required fields.');

          return false;
        }

        if (Number.isNaN(Number(lotSize)) || Number(lotSize) < 0) {
          Swal.showValidationMessage('Lot Size must be a valid number.');

          return false;
        }

        return {
          itemNo,
          itemName,
          itemClass,
          lotSize: Number(lotSize),
        };
      },
    }).then((result) => {
      if (!result.isConfirmed || !result.value) {
        return;
      }

      const payload = result.value;

      Swal.fire({
        title: 'Saving Item...',
        text: 'Please wait',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      this.http
        .post(config.apiServer + '/api/partMaster/add', payload)
        .subscribe({
          next: () => {
            Swal.fire({
              title: 'Success',
              text: 'Item Master has been added successfully.',
              icon: 'success',
              confirmButtonColor: '#14b89a',
            });

            this.fetchData();
          },

          error: (err) => {
            const message = err?.error?.message;

            if (message === 'Part_Master_already') {
              Swal.fire({
                title: 'Duplicate Item',
                text: 'This Item Master already exists.',
                icon: 'warning',
                confirmButtonColor: '#14b89a',
              });

              return;
            }

            Swal.fire({
              title: 'Add Item Failed',
              text:
                err?.error?.error ||
                message ||
                err?.message ||
                'Cannot add Item Master',
              icon: 'error',
              confirmButtonColor: '#dc3545',
            });
          },
        });
    });
  }

  editItem(row: PartMasterRow): void {
    if (this.isSyncing) {
      return;
    }

    const currentItemNo = String(row.itemNo || '');

    const currentItemName = String(row.itemName || '');

    const currentItemClass = String(row.itemClass || '');

    const currentLotSize = row.lotSize == null ? '' : String(row.lotSize);

    Swal.fire({
      width: 560,
      title: 'Edit Item Master',
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
      showCancelButton: true,
      confirmButtonColor: '#3c8dbc',
      cancelButtonColor: '#6c757d',
      allowOutsideClick: false,

      html: `
        <div style="
          font-family:Arial,sans-serif;
          text-align:left;
          padding:5px 8px 0;
        ">
  
          <div style="margin-bottom:14px;">
            <label style="
              display:block;
              margin-bottom:6px;
              font-size:12px;
              font-weight:700;
              color:#374151;
            ">
              Item No. <span style="color:#dc3545;">*</span>
            </label>
  
            <input
              id="swal-edit-item-no"
              value="${this.escapeHtml(currentItemNo)}"
              style="
                width:100%;
                height:40px;
                padding:8px 11px;
                font-size:13px;
                border:1px solid #ced4da;
                border-radius:6px;
                box-sizing:border-box;
              "
            />
          </div>
  
          <div style="margin-bottom:14px;">
            <label style="
              display:block;
              margin-bottom:6px;
              font-size:12px;
              font-weight:700;
              color:#374151;
            ">
              Item Name <span style="color:#dc3545;">*</span>
            </label>
  
            <input
              id="swal-edit-item-name"
              value="${this.escapeHtml(currentItemName)}"
              style="
                width:100%;
                height:40px;
                padding:8px 11px;
                font-size:13px;
                border:1px solid #ced4da;
                border-radius:6px;
                box-sizing:border-box;
              "
            />
          </div>
  
          <div style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:12px;
          ">
  
            <div>
              <label style="
                display:block;
                margin-bottom:6px;
                font-size:12px;
                font-weight:700;
                color:#374151;
              ">
                Item Class <span style="color:#dc3545;">*</span>
              </label>
  
              <select
                id="swal-edit-item-class"
                style="
                  width:100%;
                  height:40px;
                  padding:8px 11px;
                  font-size:13px;
                  border:1px solid #ced4da;
                  border-radius:6px;
                  background:#fff;
                  box-sizing:border-box;
                "
              >
                <option value="">-- Select Item Class --</option>
  
                <option
                  value="G"
                  ${currentItemClass === 'G' ? 'selected' : ''}
                >
                  General
                </option>
  
                <option
                  value="L"
                  ${currentItemClass === 'L' ? 'selected' : ''}
                >
                  Lamination
                </option>
  
                <option
                  value="S"
                  ${currentItemClass === 'S' ? 'selected' : ''}
                >
                  Stator
                </option>
              </select>
            </div>
  
            <div>
              <label style="
                display:block;
                margin-bottom:6px;
                font-size:12px;
                font-weight:700;
                color:#374151;
              ">
                Lot Size <span style="color:#dc3545;">*</span>
              </label>
  
              <input
                id="swal-edit-lot-size"
                type="number"
                min="0"
                value="${currentLotSize}"
                style="
                  width:100%;
                  height:40px;
                  padding:8px 11px;
                  font-size:13px;
                  border:1px solid #ced4da;
                  border-radius:6px;
                  box-sizing:border-box;
                "
              />
            </div>
  
          </div>
  
        </div>
      `,

      preConfirm: () => {
        const itemNo = (
          document.getElementById('swal-edit-item-no') as HTMLInputElement
        )?.value?.trim();

        const itemName = (
          document.getElementById('swal-edit-item-name') as HTMLInputElement
        )?.value?.trim();

        const itemClass = (
          document.getElementById('swal-edit-item-class') as HTMLSelectElement
        )?.value;

        const lotSize = (
          document.getElementById('swal-edit-lot-size') as HTMLInputElement
        )?.value;

        if (!itemNo || !itemName || !itemClass || lotSize === '') {
          Swal.showValidationMessage('Please fill in all required fields.');

          return false;
        }

        return {
          partMasterId: row.id,
          itemNo,
          itemName,
          itemClass,
          lotSize: Number(lotSize),
        };
      },
    }).then((result) => {
      if (!result.isConfirmed || !result.value) {
        return;
      }

      Swal.fire({
        title: 'Updating Item...',
        text: 'Please wait',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      this.http
        .post(config.apiServer + '/api/partMaster/updateMaster', result.value)
        .subscribe({
          next: () => {
            Swal.fire({
              title: 'Updated',
              text: 'Item Master has been updated successfully.',
              icon: 'success',
              confirmButtonColor: '#14b89a',
            });

            this.fetchData();
          },

          error: (err) => {
            Swal.fire({
              title: 'Update Failed',
              text:
                err?.error?.error ||
                err?.error?.message ||
                err?.message ||
                'Cannot update Item Master',
              icon: 'error',
              confirmButtonColor: '#dc3545',
            });
          },
        });
    });
  }

  deleteItem(row: PartMasterRow): void {
    if (this.isSyncing) {
      return;
    }

    Swal.fire({
      title: 'Delete Item Master?',
      html: `
        <div style="
          font-family:Arial,sans-serif;
          text-align:center;
          color:#555;
          font-size:13px;
        ">
          Are you sure you want to delete
          <div style="
            margin-top:8px;
            font-size:16px;
            font-weight:700;
            color:#222;
          ">
            ${this.escapeHtml(row.itemNo)}
          </div>
  
          <div style="
            margin-top:3px;
            color:#777;
          ">
            ${this.escapeHtml(row.itemName)}
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      Swal.fire({
        title: 'Deleting...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      this.http
        .post(config.apiServer + '/api/partMaster/delete', {
          partMasterId: row.id,
        })
        .subscribe({
          next: () => {
            Swal.fire({
              title: 'Deleted',
              text: 'Item Master has been deleted successfully.',
              icon: 'success',
              confirmButtonColor: '#14b89a',
            });

            this.fetchData();
          },

          error: (err) => {
            Swal.fire({
              title: 'Delete Failed',
              text:
                err?.error?.error ||
                err?.error?.message ||
                err?.message ||
                'Cannot delete Item Master',
              icon: 'error',
              confirmButtonColor: '#dc3545',
            });
          },
        });
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
      `,
    });

    /* ===================================================
       CALL API
    =================================================== */

    this.http
      .get<SyncPbassResponse>(
        config.apiServer + '/api/partMaster/syncMasterPbass'
      )
      .subscribe({
        next: (res) => {
          this.isSyncing = false;

          Swal.close();

          const totalFromPbass = Number(res?.totalFromPbass || 0);

          const validRows = Number(res?.validRows || 0);

          const createdCount = Number(res?.createdCount || 0);

          const updatedCount = Number(res?.updatedCount || 0);

          const skippedCount = Number(res?.skippedCount || 0);

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
            `,
          }).then(() => {
            this.fetchData();
          });
        },

        error: (err) => {
          this.isSyncing = false;

          Swal.close();

          Swal.fire({
            width: 450,

            title: 'PBASS Sync Failed',

            text:
              err?.error?.error ||
              err?.error?.message ||
              err?.message ||
              'Cannot synchronize Part Master from PBASS',

            icon: 'error',

            confirmButtonText: 'OK',

            confirmButtonColor: '#d9534f',

            allowOutsideClick: false,
          });
        },
      });
  }

  escapeHtml(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* =====================================================
     ITEM CLASS DISPLAY
  ===================================================== */

  getItemClassName(itemClass?: string | null): string {
    switch (String(itemClass || '').toUpperCase()) {
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

  formatDate(value?: string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  openSpecialCode(row: PartMasterRow): void {
    const specialCodes = Array.isArray(row.specialCodes)
      ? row.specialCodes
      : [];

    // =====================================================
    // BUILD CURRENT SPECIAL CODE LIST
    // =====================================================

    const specialCodeHtml =
      specialCodes.length > 0
        ? specialCodes
            .map(
              (special, index) => `
                <div
                  style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:10px;
                    padding:9px 12px;
                    margin-bottom:7px;
                    border:1px solid #dce5eb;
                    border-radius:8px;
                    background:#f8fafc;
                  "
                >
  
                  <div
                    style="
                      display:flex;
                      align-items:center;
                      gap:10px;
                    "
                  >
  
                    <div
                      style="
                        width:26px;
                        height:26px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        border-radius:6px;
                        background:#eaf9f5;
                        color:#087b68;
                        font-size:10px;
                        font-weight:900;
                      "
                    >
                      ${index + 1}
                    </div>
  
                    <strong
                      style="
                        color:#1f2937;
                        font-size:13px;
                      "
                    >
                      ${this.escapeHtml(special.specialCodeName)}
                    </strong>
  
                  </div>
  
                </div>
              `
            )
            .join('')
        : `
            <div
              style="
                padding:18px;
                text-align:center;
                border:1px dashed #cbd5e1;
                border-radius:8px;
                color:#94a3b8;
                font-size:12px;
              "
            >
              No Special Code
            </div>
          `;

    // =====================================================
    // POPUP
    // =====================================================

    Swal.fire({
      width: 600,

      title: 'Special Code',

      showCancelButton: true,

      confirmButtonText: 'Add Special Code',

      cancelButtonText: 'Close',

      confirmButtonColor: '#14b89a',

      cancelButtonColor: '#6c757d',

      focusConfirm: false,

      html: `
  
        <div
          style="
            text-align:left;
            font-family:Arial,sans-serif;
          "
        >
  
          <!-- PART INFO -->
  
          <div
            style="
              padding:12px 14px;
              margin-bottom:16px;
              border-radius:10px;
              background:#eef9f6;
              border:1px solid #c8ece4;
            "
          >
  
            <div
              style="
                font-size:10px;
                font-weight:800;
                color:#64748b;
              "
            >
              ITEM
            </div>
  
            <div
              style="
                margin-top:3px;
                font-size:16px;
                font-weight:900;
                color:#0f172a;
              "
            >
              ${this.escapeHtml(row.itemNo)}
            </div>
  
            <div
              style="
                margin-top:3px;
                color:#64748b;
                font-size:11px;
              "
            >
              ${this.escapeHtml(row.itemName)}
            </div>
  
          </div>
  
  
          <!-- CURRENT SPECIAL CODE -->
  
          <div
            style="
              margin-bottom:16px;
            "
          >
  
            <div
              style="
                margin-bottom:8px;
                font-size:11px;
                font-weight:900;
                color:#374151;
              "
            >
              CURRENT SPECIAL CODE
              (${specialCodes.length})
            </div>
  
            <div
              style="
                max-height:220px;
                overflow:auto;
              "
            >
              ${specialCodeHtml}
            </div>
  
          </div>
  
  
          <!-- ADD NEW -->
  
          <div>
  
            <label
              style="
                display:block;
                margin-bottom:6px;
                font-size:11px;
                font-weight:900;
                color:#374151;
              "
            >
              ADD NEW SPECIAL CODE
            </label>
  
            <input
              id="swal-special-code"
              class="swal2-input"
              placeholder="Enter Special Code"
              autocomplete="off"
              style="
                width:100%;
                height:42px;
                margin:0;
                padding:8px 11px;
                font-size:13px;
                border:1px solid #ced4da;
                border-radius:7px;
                box-sizing:border-box;
              "
            />
  
          </div>
  
        </div>
  
      `,

      preConfirm: () => {
        const input = document.getElementById(
          'swal-special-code'
        ) as HTMLInputElement;

        const specialCodeName = String(input?.value || '').trim();

        if (!specialCodeName) {
          Swal.showValidationMessage('Please enter Special Code.');

          return false;
        }

        // ===============================================
        // CHECK DUPLICATE FRONTEND
        // ===============================================

        const duplicated = specialCodes.some(
          (code) =>
            String(code.specialCodeName || '')
              .trim()
              .toUpperCase() === specialCodeName.toUpperCase()
        );

        if (duplicated) {
          Swal.showValidationMessage('This Special Code already exists.');

          return false;
        }

        return {
          specialCodeName,
        };
      },
    }).then((result) => {
      if (!result.isConfirmed || !result.value) {
        return;
      }

      const payload = {
        partMasterId: Number(row.id),

        specialCodeName: result.value.specialCodeName,
      };

      // =====================================================
      // SAVING
      // =====================================================

      Swal.fire({
        title: 'Adding Special Code...',

        allowOutsideClick: false,

        allowEscapeKey: false,

        showConfirmButton: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      this.http
        .post(
          config.apiServer + '/api/partMaster/mapSpecialCodePartModel',
          payload
        )
        .subscribe({
          next: () => {
            Swal.fire({
              title: 'Success',

              text: 'Special Code has been added successfully.',

              icon: 'success',

              confirmButtonColor: '#14b89a',
            });

            // โหลดใหม่ทั้ง Part + Special Code
            this.fetchData();
          },

          error: (err) => {
            const message = err?.error?.message;

            if (message === 'map_specialCodeModel_already') {
              Swal.fire({
                title: 'Duplicate Special Code',

                text: 'This Special Code already exists.',

                icon: 'warning',

                confirmButtonColor: '#14b89a',
              });

              return;
            }

            if (message === 'Part_Master_notFound') {
              Swal.fire({
                title: 'Part Master Not Found',

                text: 'This Part Master does not exist.',

                icon: 'warning',

                confirmButtonColor: '#14b89a',
              });

              return;
            }

            Swal.fire({
              title: 'Add Special Code Failed',

              text:
                err?.error?.error ||
                message ||
                err?.message ||
                'Cannot add Special Code',

              icon: 'error',

              confirmButtonColor: '#dc3545',
            });
          },
        });
    });
  }

  /* =====================================================
     TRACK BY
  ===================================================== */

  trackById(index: number, row: PartMasterRow): number {
    return row.id;
  }
}
