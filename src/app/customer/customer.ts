import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, AbstractControl, Validators, ValidationErrors } from '@angular/forms';
import { Server } from '../server';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import iziToast from 'izitoast';
import Swal from 'sweetalert2';
declare var $: any;

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTooltipModule, FormsModule, ReactiveFormsModule],
  templateUrl: './customer.html',
  styleUrl: './customer.css'
})
export class Customer {
isLoading = false;
userRoles: number[] = [];
user_id: any;
customerList: any[] = [];
constructor(private serverService: Server, private fb: FormBuilder, private http: HttpClient, private router: Router) { }
  ngOnInit(): void {
    const rolesString = localStorage.getItem('roles');
    this.userRoles = rolesString ? JSON.parse(rolesString) : [];
    this.user_id = localStorage.getItem('user_id');
    this.fetchCustomer();
  }
  home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
  fetchCustomer() {
    this.isLoading = true;
    const user_id = localStorage.getItem('user_id');
    const requestData = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/customer_list',
      user_id: user_id,
    };

    this.serverService.sendServer(requestData).subscribe({
      next: (response: any) => {
        if (response.status && response.data) {
          this.isLoading = false;
          this.customerList = response.data;
          const table = $('#datatable').DataTable();
          table.destroy();

          setTimeout(() => {
            $('#datatable').DataTable();
          }, 0);
        }
      }
    });
  }
   editCustomer(contact_id: string) {
    this.router.navigate(['/editCustomer', contact_id]);
  }
confirmDelete(contact_id: string, index: number) {
  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      this.isLoading = true;
      this.deleteInvoice(contact_id, index);
    }
  });
}

deleteInvoice(contact_id: string, index: number) {
  const url = 'https://chettinadlink.cal4care.com/api/zoho/deleteCustomer';

  const body = {
    moduleType: 'zoho',
    api_type: 'web',
    contact_id
  };

  this.http.post(url, body).subscribe({
    next: () => {
      iziToast.success({
        message: 'Customer deleted successfully',
        position: 'topRight'
      });

      this.fetchCustomer();
      this.isLoading = false;
    },
    error: (err) => {
      console.error(err);
      iziToast.error({
        message: 'Failed to delete customer',
        position: 'topRight'
      });
      this.isLoading = false;
    }
  });
}

}
