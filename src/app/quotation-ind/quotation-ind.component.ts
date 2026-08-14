import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { Server } from '../server';
import iziToast from 'izitoast';
import Swal from 'sweetalert2';
export interface Quotation {
  date: string;
  estimate_number?: string;
  reference_number?: string;
  customer_name?: string;
  invoice_id?: string;
}
@Component({
  selector: 'app-quotation-ind',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './quotation-ind.component.html',
  styleUrls: ['./quotation-ind.component.css']
})
export class QuotationIndComponent implements OnInit {
  isLoading: boolean = false;
  selectAllCheckbox = false;
  user_ids: any;
 quotationListInd: Quotation[] = [];

  //pagination
  recordNotFound = false;
  pageLimit = 50;
  paginationData: any = { info: 'hide' };
  offset_count = 0;
  response_total_cnt: any;

  // pagination variables
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalPages: number = 0;
  paginatedList: any[] = [];
  filteredQuotationList: any[] = [];
  searchQuery = '';
  permissions = {
    add: 0,
    edit: 0,
    list: 0,
    delete: 0,
    search: 0,
    chettinadu: 0,
    normal: 0,
    pdf: 0
  };
showNoPermissionMessage: boolean = false;
  userRoles: number[] = [];
  constructor(
    private router: Router,
    private http: HttpClient,
    private serverService: Server,
  ) { }

  ngOnInit(): void {
    const rolesString = localStorage.getItem('roles');
    this.userRoles = rolesString ? JSON.parse(rolesString) : [];
    this.isLoading = false;
    this.fetchQuotationList();
    this.user_ids = localStorage.getItem('user_id');
  }
   home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
  addQuotationInd() {
    this.router.navigate(['/AddQuotation'])
  }

  fetchQuotationList() {
    const requestData = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/quotation_list',
      user_id: localStorage.getItem('user_id'),
    };

    this.serverService.sendServer(requestData).subscribe((response: any) => {
      if (response.data?.length) {
        this.quotationListInd = response.data;
        this.filteredQuotationList = [...this.quotationListInd];
        this.permissions = response.permissions
        this.setupPagination();
        // if (this.permissions.list === 1) {
        //   this.isLoading = false;
        //   this.setupPagination();
        //   this.showNoPermissionMessage = true;
        // } else {
        //   this.filteredQuotationList = [];
        //   this.quotationListInd = [];
        //   this.showNoPermissionMessage = true;
        //   this.isLoading = false;
        // }
      } else {
        this.filteredQuotationList = [];
        this.quotationListInd = [];
        this.showNoPermissionMessage = true;
        this.isLoading = false;
      }
    });
  }
  openPdf(url: string) {
    window.open(url, '_blank');
  }
  searchQuotation() {
    const q = this.searchQuery.trim().toLowerCase();

    if (!q) {
      this.filteredQuotationList = [...  this.quotationListInd];
    } else {
      this.filteredQuotationList = this.quotationListInd.filter((inv: Quotation)=>
        inv.estimate_number?.toLowerCase().includes(q) ||
        inv.reference_number?.toLowerCase().includes(q) ||
        inv.customer_name?.toLowerCase().includes(q)
      );
    }

    this.setupPagination();
  }

  setupPagination() {
    this.totalPages = Math.ceil(
      this.filteredQuotationList.length / this.itemsPerPage
    );
    this.currentPage = 1;
    this.updatePaginatedList();
  }
  updatePaginatedList() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.paginatedList = this.filteredQuotationList.slice(start, end);
  }


changePage(page: number) {
  this.currentPage = page;
  this.updatePaginatedList();
}

 nextPage() {
  if (this.currentPage < this.totalPages) {
    this.currentPage++;
    this.updatePaginatedList();
  }
}

prevPage() {
  if (this.currentPage > 1) {
    this.currentPage--;
    this.updatePaginatedList();
  }
}


  getVisiblePages(): (number | string)[] {
    const visible: (number | string)[] = [];

    if (this.totalPages <= 6) {
      // Show all pages if <=6
      for (let i = 1; i <= this.totalPages; i++) {
        visible.push(i);
      }
      return visible;
    }

    // Always show first page
    visible.push(1);

    // Left ellipsis
    if (this.currentPage > 4) {
      visible.push('...');
    }

    // Pages around current page
    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(this.totalPages - 1, this.currentPage + 1);

    for (let i = start; i <= end; i++) {
      visible.push(i);
    }

    // Right ellipsis
    if (this.currentPage < this.totalPages - 3) {
      visible.push('...');
    }

    // Always show last page
    visible.push(this.totalPages);

    return visible;
  }


  editQuatation(estimate_id: string) {
    this.router.navigate(['/EditQuotation', estimate_id]);
  }
  convertQuatation(estimate_id: string) {
    this.router.navigate(['/ConvertInvoice', estimate_id]);
  }
  confirmDelete(estimate_id: string, index: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteInvoice(estimate_id, index);
      }
    });
  }
  deleteInvoice(estimate_id: string, index: number) {
    this.isLoading = true;
    const url = `https://chettinadlink.cal4care.com/api/zoho/deleteQuotation/${estimate_id}`;
    this.http.get(url).subscribe({
      next: () => {
        iziToast.success({ message: 'Invoice deleted successfully', position: 'topRight' });
        // Remove from table
        this.isLoading = false;
        this.fetchQuotationList();
        this.paginatedList.splice(index, 1);
      },
      error: (err) => {
        console.error(err);
        iziToast.error({ message: 'Failed to delete invoice', position: 'topRight' });
      }
    });
  }


}
