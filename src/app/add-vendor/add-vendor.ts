import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Server } from '../server';
import { Location } from '@angular/common';
import iziToast from 'izitoast';
@Component({
  selector: 'app-add-vendor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-vendor.html',
  styleUrls: ['./add-vendor.css']
})
export class AddVendor {
  vendorForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  customer_code: any;
  constructor(private fb: FormBuilder, private serverService: Server, private router: Router, private location: Location) { }

  ngOnInit() {
    this.vendorForm = this.fb.group({
      company_name: ['', Validators.required],
      company_code: [''],
      vendor_name: ['', Validators.required],
      address_1: [''],
      address_2: [''],
      city: [''],
      // phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      // mobile_phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      phone: [''],
      mobile_phone: [''],
      fax: [''],
      e_mail: [''],
      // e_mail: ['', [Validators.required, Validators.email]],
      bank: [''],
       gas: [''],
      oil: [''],
      expense: [''],
      transport: [''],
    });
    this.getVendorCode();
  }
  home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
  getVendorCode() {
    const requestData = { api_url: 'getVendorCode' };
    this.serverService.sendServerGet(requestData).subscribe({
      next: (response: any) => {
        if (response.status == 'true' || response.status == true) {
          this.customer_code = response.code;
           this.vendorForm.get('company_code')?.setValue(this.customer_code);
          console.log('response',this.customer_code);
        }
      },
      error: (err) => console.error('❌ Network/API error', err)
    });
  }
  onSubmit() {
    if (this.vendorForm.invalid) {
      this.vendorForm.markAllAsTouched();
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
      api_url: 'vendorSave',
      user_id: user_id,
      company_code: this.vendorForm.value.company_code,
      company_name: this.vendorForm.value.company_name,
      vendor_name: this.vendorForm.value.vendor_name,
      address_1: this.vendorForm.value.address_1,
      address_2: this.vendorForm.value.address_2,
      city: this.vendorForm.value.city,
      state: this.vendorForm.value.state,
      country: this.vendorForm.value.country,
      phone: this.vendorForm.value.phone,
      mobile_phone: this.vendorForm.value.mobile_phone,
      fax: this.vendorForm.value.fax,
      email: this.vendorForm.value.e_mail,
      bank_details: this.vendorForm.value.bank,
      gas:this.vendorForm.value.gas ? 1 : 0, 
      oil:this.vendorForm.value.oil ? 1 : 0, 
      expense:this.vendorForm.value.expense ? 1 : 0, 
      transport:this.vendorForm.value.transport ? 1 : 0, 
    };
    
    this.serverService.sendServer(vendorData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('Vendor saved successfully:', response);

        if (response?.status === true && response?.message === 'Vendor details added successfully') {
          iziToast.success({
            message: 'Vendor saved successfully',
            position: 'topRight'
          });
          this.router.navigate(['/vendorList'], { replaceUrl: true });
        } else {
          this.errorMessage = 'Failed to save vendor';
          iziToast.error({
            message: 'Error saving vendor',
            position: 'topRight'
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.errorMessage = 'Server error occurred';
        iziToast.error({
          message: 'Server error during vendor save',
          position: 'topRight'
        });
      }
    });
  }
  cancel() {
    this.location.back()
  }
}
