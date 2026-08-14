import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Server } from '../server';
import iziToast from 'izitoast';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-tax',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTooltipModule],
  templateUrl: './tax.html',
  styleUrl: './tax.css'
})
export class Tax implements OnInit {
  isLoading = false;
  taxList: any[] = [];
  savedRows: any[] = [];
  limit: string = '10';
  offset: string = '0';
  rows: any[] = [
    { tax: '', percentage: '', errors: {} }
  ];
  editingIndex: number | null = null;
  isEditMode: boolean = false;
  editingTaxId: string | null = null;
  editRowData: any = {};
  userRoles: number[] = [];
  constructor(private http: HttpClient, private serverService: Server,private router: Router) { }

  ngOnInit(): void {
    const rolesString = localStorage.getItem('roles');
    this.userRoles = rolesString ? JSON.parse(rolesString) : [];
    this.getTaxList();
  }
  addRow() {
    this.rows.push({ tax: '', percentage: '', errors: {} });
  }
  removeRow(index: number) {
    if (this.rows.length > 1) {
      this.rows.splice(index, 1);
    }
  }
   home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
  validateRow(row: any): boolean {
    row.errors = {};

    if (!row.tax) {
      row.errors.tax = 'Tax is required.';
    }

    if (!row.percentage) {
      row.errors.percentage = 'Percentage is required.';
    }

    return Object.keys(row.errors).length === 0;
  }
  getTaxList(): void {
    this.isLoading = true;
    const accessToken = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    });
    this.http.get<any>('https://chettinadlink.cal4care.com/api/taxList', { headers }).subscribe({
      next: (response) => {
        if (response?.status && response?.data) {
          this.taxList = response.data;
        } else {
          console.error('Failed to fetch tax list:', response?.message);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error occurred while fetching tax list:', err);
        this.isLoading = false;
      }
    });
  }

  // Save all valid rows
  saveTax(): void {
    this.isLoading = true;
    const user_id = localStorage.getItem('user_id');
    const validRows = this.rows.filter(row => this.validateRow(row));

    if (validRows.length === 0) {
      iziToast.error({
        message: 'Please correct the errors before saving.',
        position: 'topRight'
      });
      return;
    }

    validRows.forEach((row, index) => {
      const requestData = {
        moduleType: 'Tax',
        api_type: 'api',
        api_url: 'taxSave',
        user_id: user_id,
        tax: row.tax,
        percentage: row.percentage
      };

      this.serverService.sendServer(requestData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.status === true || response?.message === 'Tax details added successfully') {
            if (index === validRows.length - 1) {
              iziToast.success({
                message: 'Tax details saved Successfully',
                position: 'topRight'
              });

              this.getTaxList();
            }
            this.rows = [{ tax: '', percentage: '', errors: {} }];
          } else {
            iziToast.error({
              message: response?.message || 'Failed to save a record',
              position: 'topRight'
            });
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error(error);
          iziToast.error({
            message: 'Network error while saving.',
            position: 'topRight'
          });
        }
      });
    });
  }



  editTaxDetails(index: number): void {
    const row = this.taxList[index];
    const taxId = row?.id;
    if (!taxId) return;

    this.isLoading = true;
    const accessToken = localStorage.getItem('access_token');
    fetch(`https://chettinadlink.cal4care.com/api/taxEdit/${taxId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        this.isLoading = false;

        if (data.status || data.data) {
          const taxData = data.data;

          // Enable edit mode
          this.isEditMode = true;
          this.editingTaxId = taxId;

          // Populate editable row
          this.rows = [{
            tax: taxData.tax,
            percentage: taxData.percentage,
            errors: {}
          }];
        } else {
          iziToast.error({
            message: data.message || 'Failed to fetch Tax details',
            position: 'topRight'
          });
        }
      })
      .catch(err => {
        this.isLoading = false;
        console.error(err);
        iziToast.error({
          message: 'Network error occurred',
          position: 'topRight'
        });
      });
  }



  updateTax(): void {
    this.isLoading = true;
    const user_id = localStorage.getItem('user_id');
    const updatedRow = this.rows[0];

    if (!this.editingTaxId) return;
    if (!this.validateRow(updatedRow)) {
      return;
    }
    const requestData = {
      moduleType: 'Tax',
      api_type: 'api',
      api_url: 'taxUpdate',
      user_id: user_id,
      tax: updatedRow.tax,
      percentage: updatedRow.percentage,
      id: this.editingTaxId
    };

    this.serverService.sendServer(requestData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response?.status === true || response?.message === 'Tax details update successfully') {
          iziToast.success({
            message: 'Tax record updated successfully.',
            position: 'topRight'
          });

          // Reset form and flags
          this.rows = [{ tax: '', percentage: '', errors: {} }];
          this.isEditMode = false;
          this.editingTaxId = null;

          this.getTaxList();
        } else {
          iziToast.error({
            message: response?.message || 'Failed to update record',
            position: 'topRight'
          });
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error(error);
        iziToast.error({
          message: 'Network error occurred during update.',
          position: 'topRight'
        });
      }
    });
  }

  deleteTaxdetsils(index: number): void {
    const taxdetails = this.taxList[index];
    if (!taxdetails?.id) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${taxdetails?.id}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Deleting...', allowOutsideClick: false });
        Swal.showLoading();

        const accessToken = localStorage.getItem('access_token');

        try {
          const response = await fetch(`https://chettinadlink.cal4care.com/api/taxDelete/${taxdetails.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          });

          const resData = await response.json();

          Swal.close();

          if (resData.status === true || resData.message === 'Tax details deleted successfully') {
            iziToast.success({
              message: 'Tax details deleted successfully!',
              position: 'topRight'
            });

            this.getTaxList();
          } else {
            iziToast.error({
              message: resData.message || 'Delete failed',
              position: 'topRight'
            });
          }
        } catch (err) {
          Swal.close();
          console.error(err);
          iziToast.error({
            message: 'Network error occurred',
            position: 'topRight'
          });
        }
      }
    });
  }
}
