import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, AbstractControl, Validators, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Location } from '@angular/common';
import iziToast from 'izitoast';
import Swal from 'sweetalert2';
type RoleKey =
  | 'dashboard'
  | 'purchase_entry'
  | 'expense_purchase_entry'
  | 'staff'
  | 'manage_product'
  | 'add_vendor'
  | 'vendor_details'
  | 'customer_manage'
  | 'tax_details'
  | 'user_profile'
  | 'expenseProduct'
  | 'invoice'
  | 'quotation'
  | 'invoice_list'
  | 'chettinad_invoice_list'
  | 'stock'

interface RolePermission {
  read: number;
  edit: number;
  delete: number;
  add: number;
}

@Component({
  selector: 'app-adduser',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './adduser.html',
  styleUrls: ['./adduser.css']
})

export class Adduser {
  roles: any[] = [];
  selectedImage: string = '';
  userForm!: FormGroup;
  files: any = {};
  preview: any = {};
  enablePermissions = false;
  constructor(private router: Router, private fb: FormBuilder, private http: HttpClient, private location: Location) {

  }

  ngOnInit(): void {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      fullname: ['', Validators.required],
      phone: [''],
      email: [''],
      address: [''],
      address2: [''],
      address3: [''],
      city: [''],
      state: [''],
      country: [''],
      pincode: [''],
      gender: [''],
      status: ['', Validators.required],
      access: ['', Validators.required],
      profile: [''],
    });
    this.getRoles();
  }
   home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }

  roleMap: Record<RoleKey, RolePermission> = {
    dashboard: { read: 101, add: 102, edit: 103, delete: 104 },
    purchase_entry: { read: 111, add: 112, edit: 113, delete: 114 },
    staff: { read: 121, add: 122, edit: 123, delete: 124 },
    manage_product: { read: 131, add: 132, edit: 133, delete: 134 },
    add_vendor: { read: 141, add: 142, edit: 143, delete: 144 },
    vendor_details: { read: 151, add: 152, edit: 153, delete: 154 },
    user_profile: { read: 161, add: 162, edit: 163, delete: 164 },
    customer_manage: { read: 171, add: 172, edit: 173, delete: 174 },
    tax_details: { read: 181, add: 182, edit: 183, delete: 184 },
    expense_purchase_entry: { read: 191, add: 192, edit: 193, delete: 194 },
    expenseProduct: { read: 201, add: 202, edit: 203, delete: 204 },
    invoice: { read: 301, add: 302, edit: 303, delete: 304 },
    quotation: { read: 311, add: 312, edit: 313, delete: 314 },
    invoice_list: { read: 321, add: 322, edit: 323, delete: 324 },
    chettinad_invoice_list: { read: 331, add: 332, edit: 333, delete: 334 },
    stock: { read: 431, add: 432, edit: 433, delete: 434 },
  };
  
  selectedRoles: number[] = [];
  toggleAll(permissionType: 'read' | 'add' | 'edit' | 'delete', event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;

    Object.keys(this.roleMap).forEach((key) => {
      const roleKey = key as RoleKey;
      const permissionCode = this.roleMap[roleKey][permissionType];

      const alreadySelected = this.selectedRoles.includes(permissionCode);

      if (isChecked && !alreadySelected) {
        this.selectedRoles.push(permissionCode);
      }

      if (!isChecked && alreadySelected) {
        this.selectedRoles = this.selectedRoles.filter(code => code !== permissionCode);
      }
    });

    // console.log('Selected Roles after toggleAll:', this.selectedRoles);
  }

  togglePermission(roleKey: RoleKey, permissionType: keyof RolePermission, event: any) {
    const permissionCode = this.roleMap[roleKey][permissionType];
    const isChecked = event.target.checked;

    if (isChecked) {
      if (!this.selectedRoles.includes(permissionCode)) {
        this.selectedRoles.push(permissionCode);
      }
    } else {
      this.selectedRoles = this.selectedRoles.filter(code => code !== permissionCode);
    }

    // console.log('Selected Permissions:', this.selectedRoles);
  }
  getRoles(): void {
    const accessToken = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    });
     
    this.http.get<any[]>('https://chettinadlink.cal4care.com/api/roles', { headers }).subscribe({
      next: (data) => {
        this.roles = data.filter(role => role.status === 1);
      },
      error: (err) => {
        console.error('Failed to load roles:', err);
      }
    });
  }
  fileValidator(control: AbstractControl): ValidationErrors | null {
    return control.value && control.value.length ? null : { fileRequired: true };
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
  viewImage(imageUrl: string) {
    this.selectedImage = imageUrl;
    const modal: any = document.getElementById('imageModal');
    if (modal) {
      const bootstrapModal = new (window as any).bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  }

  async onSubmit() {
    // Mark all fields as touched
    Object.keys(this.userForm.controls).forEach(controlName => {
      const control = this.userForm.get(controlName);
      if (control) {
        control.markAsTouched();
      }
    });

    if (this.userForm.valid) {
      const formData = new FormData();

      // Append all form fields
      formData.append('username', this.userForm.value.username);
      formData.append('full_name', this.userForm.value.fullname);
      formData.append('email', this.userForm.value.email);
      formData.append('phone', this.userForm.value.phone);
      formData.append('address_1', this.userForm.value.address);
      formData.append('address_2', this.userForm.value.address2 || '');
      formData.append('address_3', this.userForm.value.address3 || '');
      formData.append('city', this.userForm.value.city);
      formData.append('state', this.userForm.value.state);
      formData.append('country', this.userForm.value.country);
      formData.append('pincode', this.userForm.value.pincode);
      formData.append('gender', this.userForm.value.gender);
      formData.append('role_id', this.userForm.value.access);
      formData.append('active_status', this.userForm.value.status);

      // Append files
      formData.append('profile_image', this.files['profile']);
      formData.append('roles', JSON.stringify(this.selectedRoles));

      // Optional: show loading
      Swal.fire({ title: 'Please wait...', allowOutsideClick: false });
      Swal.showLoading();

      try {
        const accessToken = localStorage.getItem('access_token');
       const response = await fetch('https://chettinadlink.cal4care.com/api/userCreate', {
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
          this.selectedRoles = [];
          this.router.navigate(['/userDetails']);
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

  cancel() {
    this.location.back()
  }

}
