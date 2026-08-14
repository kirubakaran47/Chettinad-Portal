
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Server } from '../../server';
import { CommonModule } from '@angular/common'; 
import { NgSelectModule } from '@ng-select/ng-select';
import iziToast from 'izitoast';
interface Term {
  id: number;
  label: string;
  payment_terms: number | null;
  payment_terms_label: string;
  description: string;
}
@Component({
  selector: 'app-convert-invoice-ind',
  standalone: true,
  imports: [CommonModule,NgSelectModule,ReactiveFormsModule],
  templateUrl: './convert-invoice-ind.component.html',
  styleUrls: ['./convert-invoice-ind.component.css']
})
export class ConvertInvoiceIndComponent implements OnInit {
    isLoading: boolean = false;
  files: File[] = [];
  invoiceForm!: FormGroup;
  invoiceId!: string;
  searchTerm: string = '';
  customers: any[] = [];
  filteredCustomers: any[] = [];
  filteredItems: any[] = [];
  allTaxes: any[] = [];
  itemsTaxOptions: any[][] = [];
  stateList: string[] = [];
  selectedCustomer: any = null;
  customerDetails: any = null;
  subTotal = 0;
  // taxSummary: any[] = [];
  grandTotal = 0;
  tdsAmount = 0;
  tdsList: any;
  termsList: Term[] = [];
  taxSummary: {
    type: string;
    percent: number;
    amount: number;
  }[] = [];
  showChettinad = false;
  taxGroupCache: { [taxId: string]: any[] } = {};
  salespersonList: any;
  customFields: { customfield_id: string; value: any; }[] = [];

  billingAddress: any;
  shippingAddress: any;
  currencyCode = '';
  gstTreatment = '';
  currencyId!: number;
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
     private serverService: Server,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.invoiceId = this.route.snapshot.paramMap.get('id')!;
    this.initForm();
    this.fetchCustomers();
    this.fetchProduct();
    this.fetchTax();
    this.getNextInvoiceNumber();
    this.loadQuotation();
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
          this.invoiceForm.patchValue({ invoiceNo: res.next_invoice });
        },
        error: (err) => {
          console.error('Error fetching next invoice number', err);
        }
      });
  }
  initForm() {
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
  }

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
      quantity: [1, Validators.required],
      rate: [0, Validators.required],
      discount: [0],
      discountType: ['amount'],
      tax: ['', Validators.required],
      amount: [0],
      tax_name: [''], 
      tax_percentage: [0],
      taxGroup: [[]]
    });

  }
  onChettinadChange(event: any) {
    this.showChettinad = event.target.checked;
    this.toggleChettinadValidators();
  }

  // Toggle validators for Chettinad form fields
  toggleChettinadValidators() {
    const controls = ['customerId', 'billFrom', 'billTo', 'prevBalance', 'currentCharges', 'tds', 'amountDue'];

    if (this.showChettinad) {
      // Make fields required and retain their current values
      controls.forEach(control => {
        const controlValue = this.invoiceForm.get(control)?.value;
        this.invoiceForm.get(control)?.setValidators([Validators.required]);
        this.invoiceForm.get(control)?.updateValueAndValidity();
        // Re-set the value if needed
        this.invoiceForm.get(control)?.setValue(controlValue);
      });
    } else {
      // Remove required validators and clear values
      controls.forEach(control => {
        this.invoiceForm.get(control)?.clearValidators();
        this.invoiceForm.get(control)?.updateValueAndValidity();
        // Clear values when unchecked
        this.invoiceForm.get(control)?.setValue('');
      });
    }
  }
  onItemSelect(item: any, index: number) {
    const row = this.itemsArray.at(index);

    const rate = +item?.rate || 0;
    const description = item?.description || ''; 
    // Patch the form row with the full item object and other details
    row.patchValue({
      item_id: item?.item_id,
      itemDetails: item,  // Pass the whole item object
      description: description, 
      quantity: 1,
      rate: rate,
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

    // Update item_id and name
    row.get('item_id')?.setValue(item?.item_id);
    row.get('name')?.setValue(item?.name);
    const taxId = row.get('tax')?.value;
    if (taxId) {
      this.fetchTaxGroupForRow(taxId, index);
    } else {
      this.recalculateInvoice();
    }
  }

  // async calculateSubTotal() {
  //   this.subTotal = this.itemsArray.controls.reduce((sum, row) => {
  //     return sum + (+row.get('amount')?.value || 0);
  //   }, 0);

  //   await this.recalculateInvoice();

  //   const taxTotal = this.taxSummary.reduce((sum, t) => sum + t.amount, 0);
  //   const adjustmentAmount = this.adjustment?.value || 0;

  //   this.grandTotal = this.subTotal + taxTotal + adjustmentAmount;
  // }

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
  onCustomerSelect(customer: any) {
    this.selectedCustomer = customer;
    this.customerDetails = null;
    this.fetchCustomerDetails();
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
  fetchCustomerDetails() {
    if (!this.selectedCustomer) return;

    const payload = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/getZohoCustomerDetail',
      contact_id: this.selectedCustomer.customer_id
    };

    this.http.post<any>(
      'https://chettinadlink.cal4care.com/api/zoho/getZohoCustomerDetail',
      payload
    ).subscribe({
      next: (res) => {

        /* ---------------- Customer Details ---------------- */
        this.customerDetails = res;
        this.invoiceForm.patchValue({
          termsAndConditions: res.getTermsandcondition || '',
          paymentTermsLabel: res.customer_id === this.selectedCustomer.customer_id || res.customer_name === this.selectedCustomer.customer_name ? res.payment_terms_label || '' : '',
        });

        this.salespersonList = res.getSalespersons || [];
        this.stateList = res.stateList || [];
        this.termsList = res.termsList || [];
        this.tdsList = res.tdsList || [];
        /* ---------------- Place of Supply ---------------- */
        let selectedState = this.stateList.find(s => s.startsWith('[TN]')) || '';

        const billingState = res.billing_address?.state;
        if (billingState) {
          const match = this.stateList.find(s =>
            s.toLowerCase().includes(billingState.toLowerCase())
          );
          if (match) selectedState = match;
        }

        this.invoiceForm.patchValue({
          placeOfSupply: selectedState
        });

        /* ---------------- Re-patch Terms AFTER list loads ---------------- */
        const invoiceTermId = this.invoiceForm.value.terms;
        const exists = this.termsList.some(t => t.id === invoiceTermId);

        if (exists) {
          // If the term exists in the terms list, patch the term
          this.invoiceForm.patchValue({
            terms: invoiceTermId
          });
        } else {
          // Fallback to an empty value or default
          this.invoiceForm.patchValue({
            terms: '' // Or set a default term id if required
          });
        }

        /* ---------------- Re-patch Salesperson ---------------- */
        const spName = this.invoiceForm.value.salesperson;
        const spExists = this.salespersonList.some(
          (sp: { salesperson_name: any; }) => sp.salesperson_name === spName
        );

        this.invoiceForm.patchValue({
          salesperson: spExists ? spName : ''
        });
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



  // ================= FETCH INVOICE =================
  loadQuotation() {
     this.isLoading = true;

    const api_req = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/editQuatation',
      estimateId: this.invoiceId
    };

    this.serverService.sendServer(api_req).subscribe((res: any) => {
      this.isLoading = false;
      if (!res?.estimate) return;

      const data = res.estimate;

      /* -------------------- Patch Header Form -------------------- */
      this.invoiceForm.patchValue({
        customerName: data.customer_name,
        estimateNo: data.estimate_number,
        referenceNo: data.reference_number,
        estimateDate: data.date,
        expiryDate: data.expiry_date,
        salesperson: data.salesperson_name,   // PATCH NAME
        placeOfSupply: data.place_of_supply,   // PATCH TEMP (TN)
        customerNotes: data.notes,
        termsAndConditions: data.terms,
        adjustment: data.adjustment,
        tds:data.tds,
      });

      /* -------------------- REQUIRED FIX -------------------- */
      this.selectedCustomer = {
        customer_id: data.customer_id,
        customer_name: data.customer_name,
        currency_id:data.currency_id
      };

      this.customerDetails = {
        customer_id: data.customer_id,
        customer_name: data.customer_name,
        currency_id:data.currency_id,
        contact_persons: data.contact_persons_details
      };

      this.billingAddress = data.billing_address;
      this.shippingAddress = data.shipping_address;
      this.currencyId = data.currency_id;
      this.gstTreatment = data.gst_treatment;


      this.fetchCustomerDetails();

      /* -------------------- Load Line Items -------------------- */
      this.itemsArray.clear();

      data.line_items.forEach((item: any) => {
        const row = this.createItemRow();

        row.patchValue({
          itemDetails: {
            item_id: item.item_id,
            name: item.name,
            hsn_or_sac: item.hsn_or_sac,
            item_tax_preferences: []
          },
          unit: item.unit,
          product_type: item.product_type,
          hsn_or_sac: item.hsn_or_sac,
          description:item.description,
          quantity: item.quantity,
          rate: item.rate,
          discount: item.discount,
          discountType:item.discountType,
          discount_amount: item.discount_amount,
          tax: item.tax_id,
          tax_name: item.tax_name,
          tax_percentage: item.tax_percentage,
          amount: item.item_total,
          taxGroup: item.line_item_taxes
        }, { emitEvent: false });

        this.itemsArray.push(row);
        const rowIndex = this.itemsArray.length - 1;
        this.itemsTaxOptions[rowIndex] = this.allTaxes;
        if (item.tax_id) {
          this.fetchTaxGroupForRow(item.tax_id, this.itemsArray.length - 1);
        }
      });

      this.recalculateInvoice();
    });
  }


  // ================= TAX =================
  fetchTaxGroupForRow(taxId: string, index: number) {
    const payload = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/getTaxGroupsValue',
      tax_id: taxId
    };

    this.http.post<any>(
      'https://chettinadlink.cal4care.com/api/zoho/getTaxGroupsValue',
      payload
    ).subscribe(res => {
      const taxes = res?.data?.tax_group?.taxes || [];
      if (!this.itemsArray.at(index)) return;

      this.itemsArray.at(index).patchValue(
        { taxGroup: taxes },
        { emitEvent: false }
      );
      this.calculateTotals();
    });
  }

  calculateTotals() {
    let sub = 0;
    const taxMap: any = {};

    this.itemsArray.controls.forEach(row => {
      const amount = +row.get('amount')?.value || 0;
      const taxes = row.get('taxGroup')?.value || [];
      sub += amount;

      taxes.forEach((t: any) => {
        const key = `${t.tax_specific_type}_${t.tax_percentage}`;
        if (!taxMap[key]) {
          taxMap[key] = { type: t.tax_specific_type, percent: t.tax_percentage, amount: 0 };
        }
        taxMap[key].amount += (amount * t.tax_percentage) / 100;
      });
    });

    this.subTotal = sub;
    this.taxSummary = Object.values(taxMap);
    this.grandTotal = this.subTotal + this.taxSummary.reduce((s: number, t: any) => s + t.amount, 0);
  }
  deleteRow(index: number) {
    if (this.itemsArray.length <= 1) {
      iziToast.warning({
        message: 'At least one item is required',
        position: 'topRight'
      });
      return;
    }

    this.itemsArray.removeAt(index);
    this.itemsTaxOptions.splice(index, 1);
    this.invoiceForm.get('tds')?.reset();
    this.calculateTotals();
  }
  // onTaxChange(index: number) {
  //   const taxId = this.itemsArray.at(index).get('tax')?.value;
  //   if (!taxId) return;

  //   this.fetchTaxGroupForRow(taxId, index);
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

  // calculateRowAmount(index: number) {
  //   const row = this.itemsArray.at(index);

  //   const qty = +row.get('quantity')?.value || 0;
  //   const rate = +row.get('rate')?.value || 0;
  //   const discount = +row.get('discount')?.value || 0;

  //   const amount = (qty * rate) - discount;

  //   row.patchValue({ amount }, { emitEvent: false });

  //   const taxId = row.get('tax')?.value;
  //   if (taxId) {
  //     this.fetchTaxGroupForRow(taxId, index);
  //   }

  //   this.calculateTotals();
  // }
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

    this.calculateTotals();
  }
  addNewRow() {
    const row = this.createItemRow();
    this.itemsArray.push(row);

    const index = this.itemsArray.length - 1;
    this.itemsTaxOptions[index] = this.allTaxes;

    this.calculateTotals();
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


  // ================= UPDATE =================
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
      const item = row.get('itemDetails')?.value || {};
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
        item_id: item.item_id || '',
        name: item.name || '',
        description: row.get('description')?.value,
        unit: row.get('unit')?.value,
        hsn_or_sac: row.get('hsn_or_sac')?.value,
        product_type: row.get('product_type')?.value,
        rate: row.get('rate')?.value,
        quantity: row.get('quantity')?.value,
        discount: discount,
        discountType: discountType,
        discount_amount: Number(discount_amount.toFixed(2)),
        tax_id: row.get('tax')?.value || '',
        tax_name: row.get('tax_name')?.value,
        tax_percentage:row.get('tax_percentage')?.value,
        item_total:item_total,
        // hsn_or_sac: item?.hsn_or_sac || '',
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

    let tdsData = null;
    if (form.taxType === 'TDS' && form.tds) {
      tdsData = {
        tax_name: form.tds.tax_name,
        section: form.tds.section,
        tax_percentage: form.tds.tax_percentage,
        amount: this.tdsAmount || 0
      };
    }
    const filesBase64 = await Promise.all(
      this.files.map(file => this.convertFileToBase64(file))
    );
    const invoiceData: any = {
      customer_id: this.selectedCustomer.customer_id,
      zoho_estimate_id: this.invoiceId,
      currency_id: this.selectedCustomer.currency_id,
      chettinadInvoice: this.showChettinad ? 1 : 0,
      invoice_number: form.invoiceNo,
      reference_number: form.orderNo || '',
      date: form.invoiceDate,
      due_date: form.dueDate || form.invoiceDate,
      payment_terms: form.terms,
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


    const payload = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/convertEstimateToInvoice',
      element_data: {
        action: 'zoho/convertEstimateToInvoice',
        user_id: localStorage.getItem('user_id'),
        invoiceData,
      }
    };
     this.isLoading = true;
    
    this.http.post('https://chettinadlink.cal4care.com/api/zoho/convertEstimateToInvoice', payload)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          if (res?.status === true) {
            iziToast.success({
              message: 'Invoice created successfully',
              position: 'topRight'
            });
            this.invoiceForm.reset();
            this.router.navigate(['/invoice']);
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

  onCancel() {
    this.invoiceForm.reset();
    this.router.navigate(['/Quotation']);
  }
}
