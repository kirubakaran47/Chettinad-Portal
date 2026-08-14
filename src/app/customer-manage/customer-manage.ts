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

type RoleKey =
  | 'dashboard'
  | 'shift_entry'
  | 'purchase_entry'
  | 'staff'
  | 'manage_product'
  | 'add_vendor'
  | 'vendor_details'
  | 'rps_details'
  | 'user_profile';
interface RolePermission {
  read: number;
  edit: number;
  delete: number;
  add: number;
}
@Component({
  selector: 'app-customer-manage',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTooltipModule, FormsModule, ReactiveFormsModule],
  templateUrl: './customer-manage.html',
  styleUrl: './customer-manage.css'
})
export class CustomerManage implements OnInit {
  isLoading = false;
  selectedUser: any;
  isUserVisible: boolean = false;
  userForm!: FormGroup;
  editForm!: FormGroup;
  // editIndex: number = -1;
  users: any[] = [];
  user_id: any;
  limit: string = '50';
  offset: string = '0';
  preview: any = {
    profile: '',
    passbook: '',
    pancard: '',
    aadhar: ''
  };
  id: any;
  editData: any;
  files: any = {};
  uploadedFiles: { [key: string]: File | null } = {
    profile: null,
    passbook: null,
    pancard: null,
    aadhar: null,
  };
  custID: any;
  userRoles: number[] = [];
  constructor(private serverService: Server, private fb: FormBuilder, private http: HttpClient, private router: Router) { }
  ngOnInit(): void {
    // $(document).ready(function () {
    //   $('#user_datatable').DataTable();
    // });
    const rolesString = localStorage.getItem('roles');
    this.userRoles = rolesString ? JSON.parse(rolesString) : [];
    this.user_id = localStorage.getItem('user_id');
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: [''],
      address: ['', Validators.required],
      address2: [''],
      address3: [''],
      city: [''],
      state: [''],
      country: [''],
      pincode: ['', [Validators.pattern(/^[0-9]{6}$/)]],
      gender: [''],
      status: [''],
      profile: ['', [this.fileValidator]],
      passbook: ['', [this.fileValidator]],
      pancard: ['', [this.fileValidator]],
      aadhar: ['', [this.fileValidator]],
      credit_limit: [''],
      credit_terms_days: [''],
      credit_overlimit: [0],
    });
    this.editForm = this.fb.group({
      username: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: [''],
      address: ['', Validators.required],
      address2: [''],
      address3: [''],
      city: [''],
      state: [''],
      country: [''],
      pincode: ['', [Validators.pattern(/^[0-9]{6}$/)]],
      gender: [''],
      status: [''],
      profile: [''],
      passbook: [''],
      pancard: [''],
      aadhar: [''],
      credit_limit: [''],
      credit_terms_days: [''],
      credit_overlimit: [0],
    });

    this.fetchUsers();

    this.userForm.get('credit_overlimit')?.valueChanges.subscribe((checked) => {
      this.userForm.get('credit_overlimit')?.setValue(checked ? 1 : 0, { emitEvent: false });
    });
     this.editForm.get('credit_overlimit')?.valueChanges.subscribe((checked) => {
      this.editForm.get('credit_overlimit')?.setValue(checked ? 1 : 0, { emitEvent: false });
    });
  }
  fileValidator(control: AbstractControl): ValidationErrors | null {
    return control.value && control.value.length ? null : { fileRequired: true };
  }
  toggleCreditOverlimit(event: any) {
    const isChecked = event.target.checked;
    this.userForm.get('credit_overlimit')?.setValue(isChecked ? 1 : 0);
  }
  toggleeditCreditOverlimit(event: any) {
    const isChecked = event.target.checked;
    this.editForm.get('credit_overlimit')?.setValue(isChecked ? 1 : 0);
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
    //this.isLoading = true;
    const username = localStorage.getItem('username');
    const user_id = localStorage.getItem('user_id');
    const requestData = {
      moduleType: 'user',
      api_type: 'api',
      api_url: 'customerReport',
    };

    this.serverService.sendServer(requestData).subscribe({
      next: (response: any) => {
        if (response.status && response.data) {

          this.users = response.data;
          const table = $('#datatable').DataTable();
          table.destroy();
          // Re-init after short delay to ensure DOM is updated
          setTimeout(() => {
            $('#datatable').DataTable();
            this.isLoading = false;
          }, 0);


        }
      }
    });
  }


  addCustomer() {
    $('#addCustomerModal').modal('show');
  }

  async onSubmit() {
    // Mark all fields as touched


    if (this.userForm.value.username && this.userForm.value.address && this.userForm.value.phone) {
      const formData = new FormData();


      // Append all form fields
      formData.append('customername', this.userForm.value.username);
      formData.append('email', this.userForm.value.email);
      formData.append('mobile', this.userForm.value.phone);
      formData.append('address_1', this.userForm.value.address);
      formData.append('address_2', this.userForm.value.address2 || '');
      formData.append('address_3', this.userForm.value.address3 || '');
      formData.append('city', this.userForm.value.city);
      formData.append('state', this.userForm.value.state);
      formData.append('country', this.userForm.value.country);
      formData.append('pincode', this.userForm.value.pincode);
      formData.append('gender', this.userForm.value.gender);
      formData.append('active_status', this.userForm.value.status);

      // Append files
      formData.append('profile_image', this.files['profile']);
      formData.append('bank_passbook', this.files['passbook']);
      formData.append('pancard', this.files['pancard']);
      formData.append('aadhar', this.files['aadhar']);

      formData.append('credit_limit', this.userForm.value.credit_limit);
      formData.append('credit_terms', this.userForm.value.credit_terms_days);
      formData.append('sale_over_credit', this.userForm.value.credit_overlimit);

      formData.append('user_id', this.user_id);


      // Optional: show loading
      Swal.fire({ title: 'Please wait...', allowOutsideClick: false });
      Swal.showLoading();

      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await fetch('https://chettinadlink.cal4care.com/api/customerCreate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
          body: formData
        });

        const result = await response.json();
        Swal.close();

        if (result.status === true) {
          iziToast.success({
            message: 'User Created Successfully',
            position: 'topRight'
          });
          this.userForm.reset();
          this.preview = {};
          $('#addCustomerModal').modal('hide');
          this.fetchUsers();
          // this.router.navigate(['/userDetails']);
        } else {
          console.error('Server Error:', result);
          iziToast.error({
            message: result.message || 'Error creating user',
            position: 'topRight'
          });
        }
      } catch (err) {
        console.error('Fetch Error:', err);
        Swal.close();
        iziToast.error({
          message: 'Network error occurred',
          position: 'topRight'
        });
      }
    }
  }

  editUser(user: any, index: number): void {
    this.isLoading = true;
    this.selectedUser = user;
    const requestData = {
      moduleType: 'user',
      api_type: 'api',
      api_url: 'customerEdit',
      user_id: user.id,
      id: user.id
    };

    this.serverService.sendServerGetID(requestData).subscribe({
      next: (response: any) => {
        if (response.status && response.data) {
          const data = response.data;
          this.isLoading = false;
          //  Set form values with the fetched data
          this.editForm.patchValue({
            username: data.customername || '',
            email: data.email || '',
            phone: data.mobile || '',
            address: data.address_1 || '',
            address2: data.address_2 || '',
            address3: data.address_3 || '',
            city: data.city || '',
            state: data.state || '',
            country: data.country || '',
            pincode: data.pincode || '',
            gender: data.gender || '',
            status: data.active_status || '',
            credit_limit: data.credit_limit || '',
            credit_terms_days: data.credit_terms || '',
            credit_overlimit: data.sale_over_credit || '',
          });

          // 🖼️ Preview images
          this.preview = {
            profile: data.profile_image_url || '',
            passbook: data.bank_passbook_url || '',
            pancard: data.pancard_url || '',
            aadhar: data.aadhar_url || '',
          };

          // 👇 Dynamically remove required validators if image already exists
          if (this.preview.profile) {
            this.editForm.get('profile')?.clearValidators();
            this.editForm.get('profile')?.updateValueAndValidity();
          }
          if (this.preview.passbook) {
            this.editForm.get('passbook')?.clearValidators();
            this.editForm.get('passbook')?.updateValueAndValidity();
          }
          if (this.preview.pancard) {
            this.editForm.get('pancard')?.clearValidators();
            this.editForm.get('pancard')?.updateValueAndValidity();
          }
          if (this.preview.aadhar) {
            this.editForm.get('aadhar')?.clearValidators();
            this.editForm.get('aadhar')?.updateValueAndValidity();
          }

          this.custID = user.id
          // Show modal
          $('#editUserModal').modal('show');
        } else {
          console.warn('No user data found in response.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to fetch user data:', err);
      }
    });
  }


  async updateUser() {


    if (this.editForm.valid) {
      const formData = new FormData();

      // Append all form fields
      formData.append('customername', this.editForm.value.username);
      formData.append('email', this.editForm.value.email);
      formData.append('mobile', this.editForm.value.phone);
      formData.append('address_1', this.editForm.value.address);
      formData.append('address_2', this.editForm.value.address2 || '');
      formData.append('address_3', this.editForm.value.address3 || '');
      formData.append('city', this.editForm.value.city);
      formData.append('state', this.editForm.value.state);
      formData.append('country', this.editForm.value.country);
      formData.append('pincode', this.editForm.value.pincode);
      formData.append('gender', this.editForm.value.gender);
      formData.append('active_status', this.editForm.value.status);

      formData.append('credit_limit', this.editForm.value.credit_limit);
      formData.append('credit_terms', this.editForm.value.credit_terms_days);
      formData.append('sale_over_credit', this.editForm.value.credit_overlimit);

      // Append files

      if (this.files['profile']) {
        formData.append('profile_image', this.files['profile']);
      } else if (this.preview.profile) {
        formData.append('profile_image_url', this.preview.profile);
      }

      if (this.files['passbook']) {
        formData.append('bank_passbook', this.files['passbook']);
      } else if (this.preview.passbook) {
        formData.append('bank_passbook_url', this.preview.passbook);
      }

      if (this.files['pancard']) {
        formData.append('pancard', this.files['pancard']);
      } else if (this.preview.pancard) {
        formData.append('pancard_url', this.preview.pancard);
      }

      if (this.files['aadhar']) {
        formData.append('aadhar', this.files['aadhar']);
      } else if (this.preview.aadhar) {
        formData.append('aadhar_url', this.preview.aadhar);
      }

      formData.append('user_id', this.user_id || '');
      formData.append('custId', this.custID || '');



      // for (const pair of formData.entries()) {
      //   console.log(pair[0] + ': ' + pair[1]);
      // }
      // Optional: show loading
      Swal.fire({ title: 'Please wait...', allowOutsideClick: false });
      Swal.showLoading();

      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await fetch('https://chettinadlink.cal4care.com/api/customerUpdate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
          body: formData
        });

        const result = await response.json();
        Swal.close();

        if (result.status === true) {
          iziToast.success({
            message: result.message,
            position: 'topRight'
          });
          this.editForm.reset();
          this.preview = {};
          $('#editUserModal').modal('hide');
          this.fetchUsers();
        } else {
          console.error('Server Error:', result);
          iziToast.error({
            message: result.message || 'Error creating user',
            position: 'topRight'
          });
        }
      } catch (err) {
        console.error('Fetch Error:', err);
        Swal.close();
        iziToast.error({
          message: 'Network error occurred',
          position: 'topRight'
        });
      }
    }
  }




  closeModal(): void {
    $('#editUserModal').modal('hide');
    $('#addCustomerModal').modal('hide');
  }
  deleteUser(user: any, index: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This user will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // Build request payload
        const requestData = {
          moduleType: 'user',
          api_type: 'api',
          api_url: 'customerDestroy',
          user_id: user.user_id || user.id,
          id: user.id
        };

        // Call server API to delete
        this.serverService.sendServerGetID(requestData).subscribe({
          next: (res: any) => {
            if (res.status) {
              iziToast.success({
                message: res.message,
                position: 'topRight'
              });
              this.fetchUsers();
            } else {
              Swal.fire('Error', res.message || 'Failed to delete user.', 'error');
            }
          },
          error: (err) => {
            console.error('Delete error:', err);
            Swal.fire('Error', 'Something went wrong while deleting the user.', 'error');
          }
        });
      }
    });
  }


  onFileChange(event: any, field: string) {
    const file = event.target.files[0];
    if (file) {
      this.files[field] = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.preview[field] = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  viewImage(src: string) {
    window.open(src, '_blank');
  }

}