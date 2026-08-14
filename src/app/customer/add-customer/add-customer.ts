import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Server } from '../../server';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import iziToast from 'izitoast';
import Swal from 'sweetalert2';
declare var $: any;
@Component({
  selector: 'app-add-customer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-customer.html',
  styleUrls: ['./add-customer.css']
})

export class AddCustomer implements OnInit {

  isLoading = false;
  isMobile = false;
  tabs = ['Other Details', 'Address', 'Contact Persons', 'Custom Fields', 'Reporting Tags', 'Remarks'];
  activeTab = 'Other Details';
  user_id: any;
  customerForm!: FormGroup;
  showMoreDetails = false;
  customerDetails: any = null;
  customerDropdown: any[] = [];
  getGstTreatments: any[] = [];
  stateList: any[] = [];
  termsList: any[] = [];
  languageList: any[] = [];
  countryList: any[] = [];
  countryAddressList: any[] = [];
  billingStateList: any[] = [];
  shippingStateList: any[] = [];
  getCurrencyList: any[] = [];
  /* ---------- TEMPLATE REFS ---------- */
  @ViewChild('otherDetailsTpl') otherDetailsTpl!: TemplateRef<any>;
  @ViewChild('addressTpl') addressTpl!: TemplateRef<any>;
  @ViewChild('contactTpl') contactTpl!: TemplateRef<any>;
  @ViewChild('remarksTpl') remarksTpl!: TemplateRef<any>;

  constructor(private serverService: Server, private fb: FormBuilder, private http: HttpClient, private router: Router) { }

  ngOnInit(): void {

    this.user_id = localStorage.getItem('user_id');
    this.customerForm = this.fb.group({

      /* ---------------- BASIC ---------------- */
      customerType: ['Business'],
      salutation: [''],
      firstName: [''],
      lastName: [''],
      companyName: [''],
      displayName: ['', Validators.required],
      email: [''],
      language: [''],
      countryCode: ['+91'],
      phone: ['',Validators.pattern(/^[0-9]*$/)],
      mobilecountryCode: ['+91'],
      mobile: ['',Validators.pattern(/^[0-9]*$/)],
      remarks: [''],
      /* ---------------- OTHER DETAILS ---------------- */
      gstTreatment: ['', Validators.required],
      placeOfSupply: ['', Validators.required],
      pan: ['',Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)],
      taxPreference: ['Taxable', Validators.required],
      currency: [''],
      paymentTerms: [''],
      enablePortal: [false],
      documents: [null],
      website: [''],
      department: [''],
      designation: [''],
      xHandle: [''],
      skype: [''],
      facebook: [''],

      /* ---------------- ADDRESS ---------------- */
      billingAddress: this.fb.group({
        attention: [''],
        country: [''],
        street1: [''],
        street2: [''],
        city: [''],
        state: [''],
        pincode: [''],
        phone: [''],
        fax: ['']
      }),

      shippingAddress: this.fb.group({
        attention: [''],
        country: [''],
        street1: [''],
        street2: [''],
        city: [''],
        state: [''],
        pincode: [''],
        phone: [''],
        fax: ['']
      }),

      /* ---------------- CONTACT PERSONS ---------------- */
      contactPersons: this.fb.array([this.createContactPerson()])
    });
    this.checkScreen();
    window.addEventListener('resize', () => this.checkScreen());
    this.fetchCustomerDropdown();
    this.customerForm
      .get('shippingAddress.country')
      ?.valueChanges.subscribe((countryId) => {
        if (countryId) {
          this.onCountryChange(countryId, 'shipping');
        }
      });

    this.customerForm
      .get('billingAddress.country')
      ?.valueChanges.subscribe((countryId) => {
        if (countryId) {
          this.onCountryChange(countryId, 'billing');
        }
      });
  }
  checkScreen() {
    this.isMobile = window.innerWidth < 768;
  }
  toggleMoreDetails() {
    this.showMoreDetails = !this.showMoreDetails;
  }
  /* ---------- TAB TEMPLATE ---------- */
  getTemplate(tab: string) {
    switch (tab) {
      case 'Other Details': return this.otherDetailsTpl;
      case 'Address': return this.addressTpl;
      case 'Contact Persons': return this.contactTpl;
      case 'Remarks': return this.remarksTpl;
      default: return null;
    }
  }
  toggleAccordion(tab: string) {
    this.activeTab = this.activeTab === tab ? '' : tab;
  }
  home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
  fetchCustomerDropdown() {
    const user_id = localStorage.getItem('user_id');
    const payload = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/getCustomerDropDown',
      user_id: user_id,
    };

    this.serverService.sendServer(payload).subscribe({
      next: (response: any) => {
        if (response) {
          this.customerDropdown = response;
          this.getGstTreatments = response.getGstTreatments;
          this.stateList = response.stateList;
          this.termsList = response.termsList;
          this.countryList = response.countryList;
          this.countryAddressList = response.country;
          this.languageList = response.languageList;
          this.getCurrencyList = response.getCurrencyList;
          console.log(this.customerDropdown);
        }
      },
      error: (err) => {
        console.error('API error:', err);
      }
    });

  }
  onCountryChange(countryId: any, type: 'billing' | 'shipping') {
    const addressGroup =
      type === 'billing'
        ? this.customerForm.get('billingAddress')
        : this.customerForm.get('shippingAddress');

    addressGroup?.get('state')?.reset();

    this.getStateList(countryId, type);
  }
  getStateList(countryId: any, type: 'billing' | 'shipping') {
    const user_id = localStorage.getItem('user_id');

    const payload = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/getstateList',
      user_id: user_id,
      countryId: countryId
    };

    this.serverService.sendServer(payload).subscribe({
      next: (response: any) => {
        if (type === 'billing') {
          this.billingStateList = response.statesList;
        } else {
          this.shippingStateList = response.statesList;
        }
      },
      error: (err) => {
        console.error('API error:', err);
      }
    });
  }

  /* ---------------- CONTACT PERSON ---------------- */
  createContactPerson(): FormGroup {
    return this.fb.group({
      salutation: ['Mr'],
      firstName: [''],
      lastName: [''],
      email: ['', Validators.email],
      workPhonecountryCode: ['+91'],
      workPhone: [''],
      mobilecountryCode: ['+91'],
      mobile: ['']
    });
  }

  get contactPersons(): FormArray {
    return this.customerForm.get('contactPersons') as FormArray;
  }

  addPerson() {
    this.contactPersons.push(this.createContactPerson());
  }

  removePerson(index: number) {
    this.contactPersons.removeAt(index);
  }
  onFileSelect(event: any) {
    const files = event.target.files;
    if (files.length) {
      this.customerForm.patchValue({
        documents: files
      });
    }
  }
  copyBillingToShipping(event: any) {
    const checked = event.target.checked;

    const billing = this.customerForm.get('billingAddress')?.value;
    const shippingGroup = this.customerForm.get('shippingAddress');

    if (!shippingGroup) return;

    if (checked) {
      shippingGroup.patchValue({
        attention: billing.attention,
        country: billing.country,
        street1: billing.street1,
        street2: billing.street2,
        city: billing.city,
        state: billing.state,
        pincode: billing.pincode,
        phone: billing.phone,
        fax: billing.fax
      });
    } else {
      shippingGroup.reset();
    }
  }

  /* ---------------- SUBMIT ---------------- */
  saveCustomer() {
    // if (this.customerForm.invalid) {
    //   this.customerForm.markAllAsTouched();
    //   return;
    // }
     if (this.customerForm.invalid) {

    if (this.customerForm.get('pan')?.invalid) {
      iziToast.error({
        message: 'Please enter a valid PAN number',
        position: 'topRight'
      });
      return;
    }

    if (this.customerForm.get('email')?.invalid) {
      iziToast.error({
        message: 'Please enter a valid email address',
        position: 'topRight'
      });
      return;
    }

    iziToast.error({
      message: 'Please fill all required fields',
      position: 'topRight'
    });

    return;
  }

    const form = this.customerForm.value;

    /* -------- Place of Supply (TN) -------- */
    const placeMatch = form.placeOfSupply?.match(/\[(.*?)\]/);
    const placeCode = placeMatch ? placeMatch[1] : form.placeOfSupply;

    /* -------- Contact Persons -------- */
    // const contactPersons = form.contactPersons.map((p: any, index: number) => ({

    //   first_name: p.firstName,
    //   salutation:p.salutation,
    //   last_name: p.lastName,
    //   email: p.email,
    //   phone: `${p.workPhonecountryCode || ''}${p.workPhone || ''}`,
    //   mobile: `${p.mobilecountryCode || ''}${p.mobile || ''}`,
    //   is_primary_contact: index === 0
    // }));
    const contactPersons = [
  {
    first_name: form.firstName,
    salutation: form.salutation,
    last_name: form.lastName,
    email: form.email,
    phone: `${form.countryCode || ''}${form.phone || ''}`,
    mobile: `${form.mobilecountryCode || ''}${form.mobile || ''}`,
    is_primary_contact: true
  },
  // Add additional contact persons from the form array
  ...form.contactPersons.map((p: any, index: number) => ({
    first_name: p.firstName,
    salutation: p.salutation,
    last_name: p.lastName,
    email: p.email,
    phone: `${p.workPhonecountryCode || ''}${p.workPhone || ''}`,
    mobile: `${p.mobilecountryCode || ''}${p.mobile || ''}`,
  
  }))
];


    /* -------- Billing Mapping -------- */
    const billingCountry = this.countryAddressList.find(
      (c: any) => c.id == form.billingAddress.country
    );

    const billingState = this.billingStateList.find(
      (s: any) => s.id == form.billingAddress.state
    );

    /* -------- Shipping Mapping -------- */
    const shippingCountry = this.countryAddressList.find(
      (c: any) => c.id == form.shippingAddress.country
    );

    const shippingState = this.shippingStateList.find(
      (s: any) => s.id == form.shippingAddress.state
    );

    /* -------- API Payload -------- */
    const user_id = localStorage.getItem('user_id');
    const payload = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/create_customer',
      user_id: user_id,

      contact_data: {
        contact_salutation:form.salutation,
        first_name:form.firstName,
        last_name:form.lastName,
        language_code:form.language,
        contact_name: form.displayName,
        company_name: form.companyName,
        // contact_type: form.customerType,
        email:form.email,
        contact_type:'customer',
        mobile:form.mobile,
        phone:form.phone,
        currency_id: form.currency,
        payment_terms: form.paymentTerms,
        notes: form.remarks || '',
        pan_no:form.pan,
        gst_treatment: form.gstTreatment,
        place_of_contact: placeCode,
        is_taxable: form.taxPreference === 'Taxable',
        website: form.website,
        twitter: form.xHandle,
        facebook: form.facebook,
        skype: form.skype,
        department: form.department,
        designation: form.designation,
        billing_address: {
          attention: form.billingAddress.attention,
          address: `${form.billingAddress.street1} ${form.billingAddress.street2 || ''}`,
          city: form.billingAddress.city,
          state: billingState?.name || '',
          zip: form.billingAddress.pincode,
          fax: form.billingAddress.fax,
          phone: form.billingAddress.phone,
          country: billingCountry?.shortname || 'IN'
        },

        shipping_address: {
          attention: form.shippingAddress.attention,
          address: `${form.shippingAddress.street1} ${form.shippingAddress.street2 || ''}`,
          city: form.shippingAddress.city,
          state: shippingState?.name || '',
          zip: form.shippingAddress.pincode,
          fax: form.shippingAddress.fax,
          phone: form.shippingAddress.phone,
          country: shippingCountry?.shortname || 'IN'
        },

        contact_persons: contactPersons
      }
    };
    this.isLoading = true;
    console.log('Zoho Payload', payload);
    this.serverService.sendServer(payload).subscribe({
      // next: (res: any) => {
      //   console.log('Customer Created Successfully', res);
      // },
      next: (res: any) => {
          this.isLoading = false;
          if (res?.status === true) {
            iziToast.success({
              message: 'Customer Created Successfully',
              position: 'topRight'
            });
            this.cancel();
          } else {
            iziToast.error({
              message: res.error,
              position: 'topRight'
            });
          }
        },
      error: err => {
        console.error('Create Customer Failed', err);
      }
    });
  }

  cancel() {
    this.customerForm.reset();
    this.router.navigate(['/customerManage']);
  }

}

