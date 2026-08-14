import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';  
import { Server } from '../server';
declare var $: any;
import iziToast from 'izitoast';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-invoice-ind',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './invoice-ind.component.html',
  styleUrls: ['./invoice-ind.component.css']
})
export class InvoiceIndComponent implements OnInit {
  isLoading: boolean = false;
  invoiceList: any[] = [];
  paginatedList: any[] = [];
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 0;
  filteredInvoiceList: any[] = [];
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
    private serverService: Server,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    const rolesString = localStorage.getItem('roles');
    this.userRoles = rolesString ? JSON.parse(rolesString) : [];
    this.fetchInvoiceList();
  }

  addInvoiceInd() {
    this.router.navigate(['/AddInvoice']);
  }
   home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
  fetchInvoiceList() {
    // this.isLoading = true;
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    const requestData = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/getZohoInvoices',
      user_id: localStorage.getItem('user_id'),
    };

    this.serverService.sendServer(requestData).subscribe((response: any) => {
      if (response.data?.length) {
        this.invoiceList = response.data;
        this.filteredInvoiceList = [...this.invoiceList];
        this.permissions = response.permissions
        this.isLoading = false;
        console.log(roles)
        if (roles.includes(321) || roles.includes(331)) {
          this.setupPagination();
        } else {
          this.filteredInvoiceList = [];
          this.invoiceList = [];
          this.showNoPermissionMessage = true;
        }
      } else {
         this.isLoading = false;
        this.filteredInvoiceList = [];
        this.invoiceList = [];
        this.showNoPermissionMessage = true;
      }
    });
  }
searchInvoices() {
  const q = this.searchQuery.trim().toLowerCase();

  if (!q) {
    this.filteredInvoiceList = [...this.invoiceList];
  } else {
    this.filteredInvoiceList = this.invoiceList.filter(inv =>
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.invoice_id?.toLowerCase().includes(q)
    );
  }

  this.setupPagination(); // ✅ always reset pagination
}

setupPagination() {
  this.totalPages = Math.ceil(
    this.filteredInvoiceList.length / this.itemsPerPage
  );
  this.currentPage = 1;
  this.updatePaginatedList();
}
updatePaginatedList() {
  const start = (this.currentPage - 1) * this.itemsPerPage;
  const end = start + this.itemsPerPage;

  this.paginatedList = this.filteredInvoiceList.slice(start, end);
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

  // Dynamic ellipsis pagination
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
  editInvoice(invoiceId: string) {
    this.router.navigate(['/EditInvoice', invoiceId]);
  }

  confirmDelete(invoiceId: string, index: number) {
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
        this.deleteInvoice(invoiceId, index);
      }
    });
     this.isLoading = true;
  }
  deleteInvoice(invoiceId: string, index: number) {
    const url = `https://chettinadlink.cal4care.com/api/zoho/deleteZohoInvoice/${invoiceId}`;
    this.http.get(url).subscribe({
      next: () => {
        iziToast.success({ message: 'Invoice deleted successfully', position: 'topRight' });
        // Remove from table
         this.isLoading = false;
        this.fetchInvoiceList();
        this.paginatedList.splice(index, 1);
      },
      error: (err) => {
         this.isLoading = false;
        console.error(err);
        iziToast.error({ message: 'Failed to delete invoice', position: 'topRight' });
      }
    });
  }
}
