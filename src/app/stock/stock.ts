
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Server } from '../server';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import iziToast from 'izitoast';
declare var $: any;
@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock.html',
  styleUrl: './stock.css'
})
export class Stock {
  isLoading = false;
  stocks: any[] = [];
  filteredStocks: any[] = [];
  paginatedStocks: any[] = [];
  filterText: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalPagesArray: number[] = [];

  showStockOutPopup = false;
  selectedStock: any = null;
  stockOutQty: number = 0;
  stockOutRemark: string = '';
  stockOutDate: string = '';
  stockOutList: any[] = [];
  constructor(private serverService: Server, private route: ActivatedRoute, private http: HttpClient, private router: Router) { }


  ngOnInit(): void {
    this.fetchUsers();
  }
  home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
  fetchUsers() {
    this.isLoading = true;
    const user_id = localStorage.getItem('user_id');
    const requestData = {
      moduleType: 'stock',
      api_type: 'api',
      api_url: 'stock/stockReport',
      user_id: user_id,
      from_date: '',
      to_date: '',
      product_name: '',

    };

    this.serverService.sendServer(requestData).subscribe({
      next: (response: any) => {
        if (response.status && response.data) {
          this.isLoading = false;
          this.stocks = response.data;
          this.filteredStocks = [...response.data];
          this.setupPagination();
        }
      }
    });
  }


  onFilterChange(): void {
    const searchTerm = this.filterText?.toLowerCase().trim();
    this.filteredStocks = searchTerm
      ? this.stocks.filter(stock =>
        stock.product_name?.toLowerCase().includes(searchTerm)
      )
      : [...this.stocks];

    this.currentPage = 1;
    this.setupPagination();
  }

  // Sort logic
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredStocks.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      return this.sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    this.setupPagination();
  }

  // Pagination logic
  setupPagination(): void {
    this.totalPages = Math.ceil(this.filteredStocks.length / this.pageSize);
    this.totalPagesArray = Array(this.totalPages).fill(0).map((_, i) => i + 1);
    this.paginateData();
  }

  paginateData(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedStocks = this.filteredStocks.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.paginateData();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateData();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateData();
    }
  }

  getStockStatus(qty: number): string {
    if (qty > 10) return 'In Stock';
    if (qty > 0) return 'Low Stock';
    return 'Out of Stock';
  }

  openStockOutPopup(stock: any) {
    this.selectedStock = stock;
    this.stockOutQty = 0;
    this.stockOutRemark = '';
    $('#showStockOutPopup').modal('show');
  }

  closeModal() {
    $('#showStockOutPopup').modal('hide');
    this.resetStockOutForm();
  }

  submitStockOut() {

    if (!this.stockOutQty || this.stockOutQty <= 0) {
      Swal.fire('Error', 'Enter valid quantity', 'error');
      return;
    }

    const user_id = localStorage.getItem('user_id');
    const today = new Date();
    const stockOutDate =
      ('0' + today.getDate()).slice(-2) + '/' +
      ('0' + (today.getMonth() + 1)).slice(-2) + '/' +
      today.getFullYear();
    const requestData = {
      moduleType: 'stock',
      api_type: 'api',
      api_url: 'stock/stockOut',
      product_name: this.selectedStock.product_name,
      product_id: this.selectedStock.product_id,
      qty: this.stockOutQty,
      user_id,
      stock_out_date: stockOutDate,
      remarks: this.stockOutRemark
    };
    this.serverService.sendServer(requestData).subscribe({
      next: (response: any) => {

        // if (response.status) {
        //   Swal.fire('Success', 'Stock out updated successfully', 'success');
        //   $('#showStockOutPopup').modal('hide');
        //   this.resetStockOutForm();
        //   this.fetchUsers();
        // }
        if (response.status === true) {
          iziToast.success({
            message: response.message || 'Stock out updated successfully',
            position: 'topRight'
          });
          this.closeModal()
          this.fetchUsers();
        } else {
          iziToast.error({
            message: response.message,
            position: 'topRight'
          });
        }

      },
      error: () => {
        Swal.fire('Error', 'Something went wrong', 'error');
      }
    });

  }
  resetStockOutForm() {
    this.stockOutQty = 0;
    this.stockOutRemark = '';
    this.stockOutDate = '';
  }
  viewStockOutPopup(stock: any) {
    const user_id = localStorage.getItem('user_id');
    const requestData = {
      moduleType: 'stock',
      api_type: 'api',
      api_url: 'stock/stockOutList',
      user_id,
      product_id: stock.product_id
    };

    this.serverService.sendServer(requestData).subscribe({
      next: (response: any) => {

        if (response.status) {
          this.stockOutList = response.data || [];
          $('#viewStockOutPopup').modal('show');
        }

      }
    });

  }
  closeViewModal() {
    $('#viewStockOutPopup').modal('hide');
  }
}