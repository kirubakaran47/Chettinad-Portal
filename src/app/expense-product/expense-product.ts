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
  selector: 'app-expense-product',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTooltipModule],
  templateUrl: './expense-product.html',
  styleUrl: './expense-product.css'
})
export class ExpenseProduct implements OnInit {
  isLoading = false;
  expenseList: any[] = [];
  savedRows: any[] = [];
  limit: string = '10';
  offset: string = '0';
  rows: any[] = [
    { expense_product: '', description: '', errors: {} }
  ];
  editingIndex: number | null = null;
  isEditMode: boolean = false;
  editingExpenseId: string | null = null;
  editRowData: any = {};
  userRoles: number[] = [];
  constructor(private http: HttpClient, private serverService: Server, private router: Router) { }

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

    if (!row.expense_product) {
      row.errors.expense_product = 'Expense Product is required.';
    }

    // if (!row.description) {
    //   row.errors.description = 'Description is required.';
    // }

    return Object.keys(row.errors).length === 0;
  }
  getTaxList(): void {
    this.isLoading = true;
    const user_id = localStorage.getItem('user_id');
    const requestData = {
      moduleType: 'expense',
      api_type: 'api',
      api_url: 'expenseList',
      user_id: user_id,
    };


    this.serverService.sendServer(requestData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.status === true || response.status === 'true') {

          this.expenseList = response.data;

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



  }

  // Save all valid rows
  saveExpense(): void {
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
        moduleType: 'expense',
        api_type: 'api',
        api_url: 'expenseSave',
        user_id: user_id,
        name: row.expense_product,
        description: row.description
      };

      this.serverService.sendServer(requestData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.status === true || response.status === 'true') {
            if (index === validRows.length - 1) {
              iziToast.success({
                message: response.message,
                position: 'topRight'
              });

              this.getTaxList();
            }
            this.rows = [{ expense_product: '', description: '', errors: {} }];
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



  editExpenseDetails(index: number): void {
    const row = this.expenseList[index];
    const expenseId = row?.id;
    if (!expenseId) return;

    this.isLoading = true;
    const accessToken = localStorage.getItem('access_token');

    fetch(`https://chettinadlink.cal4care.com/api/expenseEdit/${expenseId}`, {
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
          const expenseData = data.data;

          // Enable edit mode
          this.isEditMode = true;
          this.editingExpenseId = expenseId;

          // Populate editable row
          this.rows = [{
            expense_product: expenseData.name,
            description: expenseData.description,
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



  updateExpense(): void {
    this.isLoading = true;
    const user_id = localStorage.getItem('user_id');
    const updatedRow = this.rows[0];

    if (!this.editingExpenseId) return;
    if (!this.validateRow(updatedRow)) {
      return;
    }
    const requestData = {
      moduleType: 'expense',
      api_type: 'api',
      api_url: 'expenseUpdate',
      user_id: user_id,
      name: updatedRow.expense_product,
      description: updatedRow.description,
      id: this.editingExpenseId
    };

    this.serverService.sendServer(requestData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response?.status === true || response.status === 'true') {
          iziToast.success({
            message: response.message,
            position: 'topRight'
          });

          // Reset form and flags
          this.rows = [{ expense_product: '', description: '', errors: {} }];
          this.isEditMode = false;
          this.editingExpenseId = null;

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

  deleteExpensedetsils(index: number): void {
    const expenseDetail = this.expenseList[index];
    if (!expenseDetail?.id) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${expenseDetail?.name}". This action cannot be undone!`,
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
         const response = await fetch(`https://chettinadlink.cal4care.com/api/expenseDelete/${expenseDetail.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          });

          const resData = await response.json();

          Swal.close();

          if (resData.status === true || resData.status === 'true') {
            iziToast.success({
              message: 'Expense details deleted successfully!',
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

