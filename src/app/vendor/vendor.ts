
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, AbstractControl, Validators, ValidationErrors } from '@angular/forms';
import { Server } from '../server';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import iziToast from 'izitoast';
import Swal from 'sweetalert2';
declare var $: any;
interface Vendors {
  serial: number | null;
  companyName: string;
  vendorName: string;
  address: string;
  phoneNo: string;
  contactPerson: string;
  emailId: string;
}
@Component({
  selector: 'app-vendor',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTooltipModule, FormsModule, ReactiveFormsModule],
  templateUrl: './vendor.html',
  styleUrls: ['./vendor.css']
})
export class Vendor implements OnInit {
  isLoading = false;
  vendors: any[] = [];
  editVendor: any = {};
  editIndex: number | null = null;
  updatevendorForm!: FormGroup;
  errorMessage: string = '';
  limit: string = '10';
  offset: string = '0';
  vendorId: string | null = null;
  userRoles: number[] = [];
  constructor(private serverService: Server, private fb: FormBuilder,private router: Router) { }
  ngOnInit(): void {
    // $(document).ready(function () {
    //   $('#datatable').DataTable();
    // });
    const rolesString = localStorage.getItem('roles');
    this.userRoles = rolesString ? JSON.parse(rolesString) : [];
    this.updatevendorForm = this.fb.group({
      company_name: [''],
      company_code: ['', Validators.required],
      vendor_name: ['', Validators.required],
      address_1: [''],
      address_2: [''],
      city: [''],
      phone: [''],
      mobile_phone: [''],
      fax: [''],
      e_mail: [''],
      bank: [''],
      gas: [''],
      oil: [''],
      expense: [''],
      transport: [''],
    });
    this.fetchVendors();
  }
   home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
  fetchVendors() {
    this.isLoading = true;
    const user_id = localStorage.getItem('user_id');
    const requestData = {
      moduleType: 'Vendor',
      api_type: 'api',
      api_url: 'vendorList',
      user_id: user_id,
      company_name: '',
      vendor_name: '',
      limit: this.limit,
      offset: this.offset
    };

    this.serverService.sendServer(requestData).subscribe({
      next: (response: any) => {
        if (response.status && response.data) {
          this.isLoading = false;
          this.vendors = response.data;
          const table = $('#datatable').DataTable();
          table.destroy();

          setTimeout(() => {
            $('#datatable').DataTable();
          }, 0);
        }
      }
    });
  }

  editVendorModal(index: number): void {
    const vendorId = this.vendors[index]?.id;
    if (!vendorId) return;
    this.editIndex = index;
    this.isLoading = true;
    const accessToken = localStorage.getItem('access_token');
    fetch(`https://chettinadlink.cal4care.com/api/vendorEdit/${vendorId}`, {
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
          const vendorData = data.data;
          console.log(vendorData);
          this.vendorId = vendorData.id;
          this.editVendor = vendorData;
          this.updatevendorForm.patchValue({
            company_code: vendorData.company_code,
            company_name: vendorData.company_name,
            vendor_name: vendorData.vendor_name,
            address_1: vendorData.address_1,
            address_2: vendorData.address_2,
            city: vendorData.city,
            phone: vendorData.phone,
            mobile_phone: vendorData.mobile_phone,
            fax: vendorData.fax,
            e_mail: vendorData.email,
            bank: vendorData.bank_details,
            gas: vendorData.gas,
            oil: vendorData.oil,
            expense: vendorData.expense,
            transport: vendorData.transport
          });

          $('#editModal').modal('show');
        } else {
          iziToast.error({
            message: data.message || 'Failed to fetch vendor details',
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

  closeModal(): void {
    $('#editModal').modal('hide');
  }

  updateVendor() {
    if (this.updatevendorForm.invalid) {
      this.updatevendorForm.markAllAsTouched();
      iziToast.error({
        message: 'Please fill out all required fields correctly.',
        position: 'topRight'
      });
      return;
    }

    this.isLoading = true;
    const user_id = localStorage.getItem('user_id');
    const vendorData = {
      moduleType: 'Vendor',
      api_type: 'api',
      api_url: 'vendorUpdate',
      user_id: user_id,
      id: this.vendorId,
      company_code: this.updatevendorForm.value.company_code,
      company_name: this.updatevendorForm.value.company_name,
      vendor_name: this.updatevendorForm.value.vendor_name,
      address_1: this.updatevendorForm.value.address_1,
      address_2: this.updatevendorForm.value.address_2,
      city: this.updatevendorForm.value.city,
      state: this.updatevendorForm.value.state,
      country: this.updatevendorForm.value.country,
      phone: this.updatevendorForm.value.phone,
      mobile_phone: this.updatevendorForm.value.mobile_phone,
      fax: this.updatevendorForm.value.fax,
      email: this.updatevendorForm.value.e_mail,
      bank_details: this.updatevendorForm.value.bank,
      gas:this.updatevendorForm.value.gas ? 1 : 0, 
      oil:this.updatevendorForm.value.oil ? 1 : 0, 
      expense:this.updatevendorForm.value.expense ? 1 : 0,
      transport:this.updatevendorForm.value.transport ? 1 : 0,  
    };
    console.log(vendorData)
    this.serverService.sendServer(vendorData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('Vendor Updated successfully:', response);

        if (response?.status === true) {
          iziToast.success({
            message: 'Vendor Updated successfully',
            position: 'topRight'
          });
          this.vendorId = null;
          $('#editModal').modal('hide');
          this.fetchVendors();
        } else {
          this.errorMessage = 'Failed to save vendor';
          iziToast.error({
            message: 'Error Updated vendor',
            position: 'topRight'
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.errorMessage = 'Server error occurred';
        iziToast.error({
          message: 'Server error during vendor Update',
          position: 'topRight'
        });
      }
    });
  }

  deleteVendor(index: number): void {
    const vendor = this.vendors[index];
    if (!vendor?.id) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${vendor.vendor_name}". This action cannot be undone!`,
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
          const response = await fetch(`https://chettinadlink.cal4care.com/api/vendorDelete/${vendor.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          });

          const resData = await response.json();

          Swal.close();

          if (resData.status === true || resData.message === 'Vendor deleted successfully') {
            iziToast.success({
              message: 'Vendor deleted successfully!',
              position: 'topRight'
            });

            this.fetchVendors();
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

