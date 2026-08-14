import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpClient } from '@angular/common/http';
import iziToast from 'izitoast';
interface Customer {
  customer_id: string;
  customer_name: string;
  email: string;
  phone: string;
  mobile: string;
  currency_code: string;
  currency_id: string;
}
interface Term {
  payment_terms_id: number;
  label: string;
  payment_terms: number | null;
  payment_terms_label: string;
  description: string;
}

@Component({
  selector: 'app-add-invoice-ind',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './add-invoice-ind.component.html',
  styleUrls: ['./add-invoice-ind.component.css']
})

export class AddInvoiceIndComponent implements OnInit {
  isLoading: boolean = false;
  taxSummary: {
    type: string;
    percent: number;
    amount: number;
  }[] = [];
  taxGroupCache: { [taxId: string]: any[] } = {};
  files: File[] = [];
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  filteredItems: any[] = [];
  searchTerm: string = '';
  selectedCustomer: any = null;
  customerDetails: any = null;
  stateList: string[] = [];
  termsList: Term[] = [];
  selectedItem: any = null;
  taxOptions: any[] = [];
  itemsTaxOptions: any[][] = [];
  allTaxes: any[] = [];
  subTotal = 0;
  totalCGST = 0;
  totalSGST = 0;
  totalIGST = 0;
  grandTotal = 0;
  cgstPercent = 0;
  sgstPercent = 0;
  igstPercent = 0;
  tdsAmount = 0;
  salespersonList: any;
  termsAndConditions: any;
  tdsList: any;
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient
  ) { }

  invoiceForm!: FormGroup;
  showChettinad = false;
  ngOnInit(): void {
    this.isLoading = false;

    this.invoiceForm = this.fb.group({
      customerName: ['', Validators.required],
      invoiceNo: ['', Validators.required],
      orderNo: [''],
      invoiceDate: ['', Validators.required],
      terms: [''],
      dueDate: [''],
      salesperson: [''],
      ecomOperator: [''],
      placeOfSupply: [''],
      customersubject: [''],
      customerId: [''],
      billFrom: [''],
      billTo: [''],
      prevBalance: [''],
      currentCharges: [''],
      billTds: [''],
      amountDue: [''],

      // ITEMS
      items: this.fb.array([this.createItemRow()]),
      taxType: ['TDS'],
      tds: [null],
      adjustment: [0],
      // PAYMENT SECTION
      paymentReceived: [false],
      paymentMode: [{ value: 'Cash', disabled: true }],
      depositTo: [{ value: 'ICICI Bank', disabled: true }],
      amountReceived: [{ value: 0, disabled: true }],
      customerNotes: [''],
      termsAndConditions: ['']
    });
    this.adjustment?.valueChanges.subscribe(() => {
      this.calculateSubTotal();
    });
    // Enable / Disable payment fields
    this.invoiceForm.get('paymentReceived')?.valueChanges.subscribe(checked => {
      ['paymentMode', 'depositTo', 'amountReceived'].forEach(field => {
        const control = this.invoiceForm.get(field);
        checked ? control?.enable() : control?.disable();
      });
    });
    this.invoiceForm.get('tds')?.valueChanges.subscribe(val => {
      console.log('Selected TDS:', val);
      this.calculateSubTotal();
    });
    this.invoiceForm.get('taxType')?.valueChanges.subscribe(() => {
      this.invoiceForm.get('tds')?.reset();
      this.calculateSubTotal();
    });
    this.fetchCustomers();
    this.fetchProduct();
    this.fetchTax();
    this.getNextInvoiceNumber();
    this.itemsTaxOptions[0] = this.allTaxes;
  }
  home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
  getNextInvoiceNumber() {
    this.http.get<{ next_invoice: string }>('https://chettinadlink.cal4care.com/api/zoho/getInvoiceCode')
      .subscribe({
        next: (res) => {
          // assuming API returns { nextInvoice: "INV-00123" }
          this.invoiceForm.patchValue({ invoiceNo: res.next_invoice });
        },
        error: (err) => {
          console.error('Error fetching next invoice number', err);
        }
      });
  }
  get gstTreatmentLabel(): string {
    if (!this.customerDetails?.gst_treatment || !this.customerDetails?.getGstTreatments) {
      return '';
    }

    const match = this.customerDetails.getGstTreatments.find(
      (t: { value: any; }) => t.value === this.customerDetails.gst_treatment
    );

    return match?.label || '';
  }
  fetchCustomers() {
    const apiUrl = 'https://chettinadlink.cal4care.com/api/zoho/customers';
    const requestPayload = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/customers',
      phone: ''
    };
    this.http.post<any>(apiUrl, requestPayload).subscribe(response => {
      if (response?.data) {
        this.customers = response.data;
        this.filteredCustomers = response.data;
      }

    }, (error) => {
      console.error('Error fetching customer data', error);
    });
  }
  onChettinadChange(event: Event) {
    this.showChettinad = (event.target as HTMLInputElement).checked;
    this.toggleChettinadValidators();
  }
  toggleChettinadValidators() {
    const controls = [
      'customerId',
      'billFrom',
      'billTo',
      'prevBalance',
      'currentCharges',
      'billTds',
      'amountDue'
    ];

    controls.forEach(name => {
      const control = this.invoiceForm.get(name);
      if (!control) return;

      if (this.showChettinad) {
        control.setValidators([Validators.required]);
        control.markAsTouched();           // ✅ force validation
      } else {
        control.clearValidators();
        control.setErrors(null);
        control.reset('');
      }

      control.updateValueAndValidity({ emitEvent: false });
    });
  }

  onCustomerSelect(customer: any) {
    this.selectedCustomer = customer;
    this.customerDetails = null;
    this.fetchCustomerDetails();
  }
  fetchCustomerDetails() {
    if (!this.selectedCustomer) {
      return;
    }

    const payload = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/customers',
      contact_id: this.selectedCustomer.customer_id
    };

    this.http.post<any>(
      'https://chettinadlink.cal4care.com/api/zoho/getZohoCustomerDetail',
      payload
    ).subscribe({
      next: (res) => {
        this.customerDetails = res;
        this.invoiceForm.patchValue({
          termsAndConditions: res.getTermsandcondition || ''
        });
        this.salespersonList = res.getSalespersons || [];
        this.tdsList = res.tdsList || [];
        // 1️⃣ Set state list first
        this.stateList = res.stateList || [];

        // 2️⃣ Default TN
        let selectedState = this.stateList.find(s => s.startsWith('[TN]')) || '';

        // 3️⃣ Override using billing address (Tamil Nadu → [TN] - Tamil Nadu)
        const billingState = res.billing_address?.state;
        if (billingState) {
          // const match = this.stateList.find(s =>
          //   s.toLowerCase().includes(billingState.toLowerCase())
          // );
          const match = this.stateList.find(s => {
            const codeMatch = s.match(/\[(.*?)\]/); // Extract text inside brackets
            return codeMatch && codeMatch[1] === billingState; // Compare codes
          });
          if (match) {
            selectedState = match;
          }
        }

        // 4️⃣ SET VALUE (Reactive Form)
        this.invoiceForm.patchValue({
          placeOfSupply: selectedState
        });

        this.termsList = res.termsList || [];
        const billingTermLabel = (res.payment_terms_label || '').trim().toLowerCase();


        // const match = this.termsList.find(t =>
        //   t.payment_terms_label.toLowerCase().includes(billingTermLabel) ||
        //   t.label.toLowerCase().includes(billingTermLabel)
        // );

        const match = this.termsList.find(t => {
          const paymentLabel = (t.payment_terms_label || '')
            .trim()
            .toLowerCase();

          const label = (t.label || '')
            .trim()
            .toLowerCase();

          return paymentLabel === billingTermLabel || label === billingTermLabel;
        });

        const selectedTermId = match ? match.payment_terms_id : null;
        this.invoiceForm.patchValue({ terms: selectedTermId });
      },
      error: (err) => {
        console.error('Customer detail error', err);
      }
    });
  }

  onSearch() {
    if (this.searchTerm) {
      this.filteredCustomers = this.customers.filter((customer: any) =>
        customer.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredCustomers = this.customers; // Reset if search term is empty
    }
  }
  // ---------- ITEM TABLE ----------
  get itemsArray(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  createItemRow(): FormGroup {
    return this.fb.group({
      item_id: [''],
      itemDetails: ['', Validators.required],
      description: [''],
      unit: [''],
      product_type: [''],
      hsn_or_sac: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      rate: [0, [Validators.required, Validators.min(1)]],
      discount: [0],
      discountType: ['amount'],
      tax: ['', Validators.required],
      amount: [0],
      tax_name: [''],
      tax_percentage: [0],
      taxGroup: [[]]
    });
  }



  addNewRow(): void {
    this.itemsArray.push(this.createItemRow());
    const index = this.itemsArray.length - 1;
    this.itemsTaxOptions[index] = this.allTaxes;
  }

  // deleteRow(index: number): void {
  //   if (this.itemsArray.length > 1) {
  //     this.itemsArray.removeAt(index);
  //   }
  // }
  deleteRow(index: number) {
    this.itemsArray.removeAt(index);
    this.itemsTaxOptions.splice(index, 1);
    this.invoiceForm.get('tds')?.reset();
    this.calculateSubTotal();
  }
  // calculateSubTotal() {
  //   this.subTotal = this.itemsArray.controls.reduce((total, row) => {
  //     return total + Number(row.get('amount')?.value || 0);
  //   }, 0);
  // }
  get adjustment() {
    return this.invoiceForm.get('adjustment');
  }


  // ---------- FILE UPLOAD ----------
  onFileSelect(event: any) {
    const selectedFiles = Array.from(event.target.files) as File[];

    for (let file of selectedFiles) {
      if (this.files.length >= 5) {
        iziToast.error({ message: 'Maximum 5 files allowed', position: 'topRight' });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        iziToast.error({ message: `${file.name} exceeds 10MB`, position: 'topRight' });
        return;
      }

      this.files.push(file);
    }

    event.target.value = '';
  }

  removeFile(index: number) {
    this.files.splice(index, 1);
  }

  fetchProduct() {
    const apiUrl = 'https://chettinadlink.cal4care.com/api/zoho/getZohoItems';
    const requestPayload = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/getZohoItems',
    };
    this.http.post<any>(apiUrl, requestPayload).subscribe(response => {
      if (response?.datas?.items) {
        this.filteredItems = response.datas.items;
      }

    }, (error) => {
      console.error('Error fetching customer data', error);
    });
  }
  fetchTax() {
    const apiUrl = 'https://chettinadlink.cal4care.com/api/zoho/getZohoTaxes';
    const requestPayload = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/getZohoTaxes',
    };
    this.http.post<any>(apiUrl, requestPayload).subscribe(response => {
      if (response?.datas?.taxes) {
        this.allTaxes = response.datas.taxes;
        console.log('All taxes:', this.allTaxes);
        this.itemsArray.controls.forEach((_, i) => {
          this.itemsTaxOptions[i] = this.allTaxes;
        });
      }

    }, (error) => {
      console.error('Error fetching customer data', error);
    });
  }

  onItemSelect(item: any, index: number) {
    const row = this.itemsArray.at(index);

    const rate = +item?.rate || 0;
    const description = item?.description || '';
    row.patchValue({
      item_id: item?.item_id,
      itemDetails: item,
      description: description,
      quantity: 1,
      rate,
      unit: item.unit,
      product_type: item.product_type || '',
      hsn_or_sac: item.hsn_or_sac || '',
      discount: 0,
      amount: rate,
      tax: item?.item_tax_preferences?.[0]?.tax_id || '',
      tax_name: item?.item_tax_preferences?.[0]?.tax_name || '',
      tax_percentage: item?.item_tax_preferences?.[0]?.tax_percentage || '',
      taxGroup: [] // reset previous tax
    }, { emitEvent: false });

    const taxId = row.get('tax')?.value;
    if (taxId) {
      this.fetchTaxGroupForRow(taxId, index);
    } else {
      this.recalculateInvoice();
    }
  }

  calculateRowAmount(index: number) {
    const row = this.itemsArray.at(index);

    const qty = +row.get('quantity')?.value || 0;
    const rate = +row.get('rate')?.value || 0;
    const discount = +row.get('discount')?.value || 0;
    const discountType = row.get('discountType')?.value;

    const subTotal = qty * rate;
    let discountAmount = 0;

    // 🔹 Apply discount based on type
    if (discountType === 'percentage') {
      discountAmount = (subTotal * discount) / 100;
    } else {
      discountAmount = discount;
    }

    const amount = Math.max(subTotal - discountAmount, 0);

    row.patchValue({ amount }, { emitEvent: false });

    // 🔁 Recalculate tax summary using selected tax
    const taxId = row.get('tax')?.value;
    if (taxId) {
      this.fetchTaxGroupForRow(taxId, index);
    }

    this.calculateSubTotal();
  }



  // onTaxChange(index: number) {
  //   const taxId = this.itemsArray.at(index).get('tax')?.value;
  //   if (taxId) {
  //     this.fetchTaxGroupForRow(taxId, index);
  //   }
  // }
  onTaxChange(index: number) {
    const row = this.itemsArray.at(index);
    const taxId = row.get('tax')?.value;
    if (!taxId) return;

    const selectedTax = this.itemsTaxOptions[index]?.find((t: any) => t.tax_id === taxId);

    if (selectedTax) {
      row.patchValue(
        {
          tax_name: selectedTax.tax_name,
          tax_percentage: Number(selectedTax.tax_percentage),
        },
        { emitEvent: false }
      );
    }


    this.fetchTaxGroupForRow(taxId, index);
  }
  recalculateInvoice() {
    let subTotal = 0;
    const taxMap: any = {};

    this.itemsArray.controls.forEach(row => {
      const amount = +row.get('amount')?.value || 0;
      const taxes = row.get('taxGroup')?.value || [];

      subTotal += amount;

      taxes.forEach((tax: any) => {
        const key = `${tax.tax_specific_type}_${tax.tax_percentage}`;

        if (!taxMap[key]) {
          taxMap[key] = {
            type: tax.tax_specific_type.toUpperCase(),
            percent: tax.tax_percentage,
            amount: 0
          };
        }

        taxMap[key].amount += (amount * tax.tax_percentage) / 100;
      });
    });

    this.subTotal = subTotal;
    this.taxSummary = Object.values(taxMap);

    const taxTotal = this.taxSummary.reduce((s: number, t: any) => s + t.amount, 0);
    this.grandTotal = this.subTotal + taxTotal + (this.adjustment?.value || 0);
  }

  // Fetch Tax Group from API
  fetchTaxGroupForRow(taxId: string, index: number) {
    const payload = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/getTaxGroupsValue',
      tax_id: taxId
    };

    this.http
      .post<any>('https://chettinadlink.cal4care.com/api/zoho/getTaxGroupsValue', payload)
      .subscribe(res => {
        const taxes = res?.data?.tax_group?.taxes || [];
        this.itemsArray.at(index).patchValue({ taxGroup: taxes }, { emitEvent: false });
        this.recalculateInvoice(); // 🔁 SAFE now
      });
  }



  calculateSubTotal() {
    // Subtotal
    this.subTotal = this.itemsArray.controls.reduce((sum, row) => {
      return sum + (+row.get('amount')?.value || 0);
    }, 0);

    // Recalculate GST
    this.recalculateInvoice();

    const taxTotal = this.taxSummary.reduce((sum, t) => sum + t.amount, 0);
    const adjustmentAmount = this.adjustment?.value || 0;

    // TDS calculation
    this.tdsAmount = 0;
    if (this.invoiceForm.get('taxType')?.value === 'TDS') {
      const selectedTds = this.invoiceForm.get('tds')?.value;

      if (selectedTds && selectedTds.tax_percentage) {
        this.tdsAmount =
          (this.subTotal * Number(selectedTds.tax_percentage)) / 100;
      }
    }

    // Final total
    this.grandTotal =
      this.subTotal + taxTotal + adjustmentAmount - this.tdsAmount;
  }








  // ---------- SAVE ----------
  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
  buildLineItems() {
    return this.itemsArray.controls.map(row => {
      const item = row.get('itemDetails')?.value;
      const rate = Number(row.get('rate')?.value) || 0;
      const quantity = Number(row.get('quantity')?.value) || 0;
      const baseAmount = rate * quantity;
      const discountValue = Number(row.get('discount')?.value) || 0;
      const discountType = row.get('discountType')?.value;
      const discount =
        discountType === 'percentage'
          ? `${discountValue}%`
          : `${discountValue}`;

      const discount_amount =
        discountType === 'percentage'
          ? (baseAmount * discountValue) / 100
          : discountValue;
      const item_total = baseAmount - discount_amount

      return {
        item_id: item?.item_id,
        name: item?.name,
        unit: row.get('unit')?.value,
        hsn_or_sac: row.get('hsn_or_sac')?.value,
        product_type: row.get('product_type')?.value,
        description: row.get('description')?.value,
        rate: row.get('rate')?.value,
        quantity: row.get('quantity')?.value,
        discount: discount,
        discountType: discountType,
        discount_amount: Number(discount_amount.toFixed(2)),
        tax_id: row.get('tax')?.value || '',
        tax_name: row.get('tax_name')?.value,
        tax_percentage: row.get('tax_percentage')?.value,
        // hsn_or_sac: item?.hsn_or_sac || '',
        item_total: item_total,
        item_tax_preferences: item?.item_tax_preferences || []
      };
    });
  }
  async saveInvoice() {
    this.invoiceForm.markAllAsTouched();

    if (this.invoiceForm.invalid) {
      iziToast.warning({
        message: 'Please fill all required fields',
        position: 'topRight'
      });
      return;
    }

    const form = this.invoiceForm.getRawValue();
    const placeOfSupplyFull = form.placeOfSupply;
    const placeOfSupplyCodeMatch = placeOfSupplyFull?.match(/\[(.*?)\]/);
    const placeOfSupplyCode = placeOfSupplyCodeMatch ? placeOfSupplyCodeMatch[1] : '';
    
    const selectedTerm = this.termsList.find(
      term => term.payment_terms_id === form.terms
    );

    const paymentTermsId = selectedTerm?.payment_terms_id || '';
    const paymentTermsLabel = selectedTerm?.payment_terms_label || '';

    let tdsData = null;
    if (form.taxType === 'TDS' && form.tds) {
      tdsData = {
        tax_name: form.tds.tax_name,
        section: form.tds.section,
        tax_percentage: form.tds.tax_percentage,
        amount: this.tdsAmount || 0
      };
    }

    // Build custom_fields ONLY if Chettinad checkbox is checked
    let customFields: any[] = [];
    // customFields.push({
    //   customfield_id: '635064000000013171',
    //   value: form.customersubject || ''
    // });
    if (this.showChettinad) {
      customFields = [
        { customfield_id: '635064000002213015', value: form.customerId || '' },
        { customfield_id: '635064000002213019', value: form.billFrom || '' },
        { customfield_id: '635064000002213023', value: form.billTo || '' },
        { customfield_id: '635064000002213027', value: form.prevBalance || '0' },
        { customfield_id: '635064000002213035', value: form.currentCharges || '0' },
        { customfield_id: '635064000002213031', value: form.billTds || '0' },
        { customfield_id: '635064000002213039', value: form.amountDue || '0' }
      ];
    }
    const filesBase64 = await Promise.all(
      this.files.map(file => this.convertFileToBase64(file))
    );
    const invoiceData: any = {
      customer_id: this.selectedCustomer.customer_id,
      currency_id: this.selectedCustomer.currency_id,
      chettinadInvoice: this.showChettinad ? 1 : 0,
      invoice_number: form.invoiceNo,
      reference_number: form.orderNo || '',
      date: form.invoiceDate,
      due_date: form.dueDate || form.invoiceDate,
      // payment_terms: form.terms,
      payment_terms_id: paymentTermsId,
      payment_terms_label: paymentTermsLabel,
      subject:form.customersubject,
      is_discount_before_tax: true,
      discount_type: 'item_level',
      is_inclusive_tax: false,
      salesperson_name: form.salesperson || '',
      place_of_supply: placeOfSupplyCode,
      termsAndConditions: form.termsAndConditions,
      customerNotes: form.customerNotes,
      adjustment: this.adjustment?.value || 0,
      tds: tdsData,
      line_items: this.buildLineItems(),
      payment_options: {
        payment_gateways: form.paymentReceived
          ? [{ configured: true, gateway_name: 'icicieazypay' }]
          : []
      },
      qr_code: { is_qr_enabled: true },
      attachments: filesBase64.map((b64, i) => ({
        file_name: this.files[i].name,
        file_type: this.files[i].type,
        content_base64: b64
      }))
    };

    // Add custom_fields only if there are any
    if (customFields.length > 0) {
      invoiceData.custom_fields = customFields;
    }

    const payload = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/create_invoices',
      element_data: {
        action: 'zoho/create_invoices',
        user_id: localStorage.getItem('user_id'),
        invoiceData,
      }
    };
    // console.log(payload)
    // return
    this.isLoading = true;

    this.http.post('https://chettinadlink.cal4care.com/api/zoho/create_invoices', payload)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          if (res?.status === true) {
            iziToast.success({
              message: 'Invoice created successfully',
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
          this.isLoading = false;
          console.error(err);
          const serverError = err?.error?.error || err?.error?.message;
          iziToast.error({
            message: serverError || 'Something went wrong. Please try again.',
            position: 'topRight'
          });
        }
      });
  }


  cancel() {
    this.invoiceForm.reset();
    this.router.navigate(['/invoice']);
  }
}
