import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Server } from '../../server';
import { HttpClient } from '@angular/common/http';
import iziToast from 'izitoast';

@Component({
  selector: 'app-add-quatationind',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './add-quatationind.component.html',
  styleUrls: ['./add-quatationind.component.css']
})
export class AddQuatationindComponent implements OnInit {
  isLoading: boolean = false;
  estimateForm!: FormGroup;
  // fileNames: string = '';
  // selectedFiles: File[] = [];
  files: File[] = [];
  customerList: any[] = [];
  isCustomerApiCalled = false;

  // CUSTOMER NAME
  customerDetails: any;
  billingAddress: any;
  shippingAddress: any;
  currencyCode = '';
  gstTreatment = '';
  placeOfSupply = '';

  // TAX
  taxSummary: {
    type: string;
    percent: number;
    amount: number;
  }[] = [];
  itemsTaxOptions: any[][] = [];
  taxList: any[] = [];
  itemSuggestions: any[] = [];
  activeItemRowIndex: number | null = null;
  subTotal = 0;
  totalCGST = 0;
  totalSGST = 0;
  totalIGST = 0;
  grandTotal = 0;
  cgstPercent = 0;
  sgstPercent = 0;

  salespersonList: any;
  stateList: any;
  currencyId!: number;
  tdsAmount = 0;
  tdsList: any;
  constructor(private fb: FormBuilder,
    private serverService: Server, private http: HttpClient,
    private router: Router,) { }

  ngOnInit(): void {
    this.isLoading = false;

    const today = new Date().toISOString().split('T')[0];
    this.estimateForm = this.fb.group({
      customerName: ['', Validators.required],
      estimateNo: ['', Validators.required],
      referenceNo: [''],
      estimateDate: [today, Validators.required],
      expiryDate: [''],
      salesperson: [''],
      projectName: [''],
      placeOfSupply: [''],
      // ITEMS TABLE
      items: this.fb.array([this.createItemRow()], Validators.required),   // default 1 row
      taxType: ['TDS'],
      tds: [null],
      adjustment: [0],
      customerNotes: [''],
      termsAndConditions: ['']
    });
    this.adjustment?.valueChanges.subscribe(() => {
      this.calculateSubTotal();
    });
    this.estimateForm.get('tds')?.valueChanges.subscribe(val => {
      console.log('Selected TDS:', val);
      this.calculateSubTotal();
    });
    this.estimateForm.get('taxType')?.valueChanges.subscribe(() => {
      this.estimateForm.get('tds')?.reset();
      this.calculateSubTotal();
    });
    this.getCustomers();
    this.getZohoTaxes();
    // this.searchZohoItems();
    this.searchZohoItems('', 1);
    this.getEstimateCode();
    this.itemsTaxOptions[0] = this.taxList;
  }
  get adjustment() {
    return this.estimateForm.get('adjustment');
  }
  home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
  getCustomers() {
    // Prevent multiple API calls when user opens again
    if (this.isCustomerApiCalled) {
      return;
    }
    this.isCustomerApiCalled = true;

    let api_req: any = {};
    api_req.moduleType = "zoho";
    api_req.api_type = "web";
    api_req.api_url = "zoho/customers";
    api_req.phone = "";

    this.serverService.sendServer(api_req).subscribe(
      (response: any) => {
        if (response && response.data) {
          this.customerList = response.data;
        }
      },
      (error) => {
        console.error("Customer API error", error);
        this.isCustomerApiCalled = false;
      }
    );
  }

  getZohoTaxes() {
    const api_req = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/getZohoTaxes'
    };
    this.serverService.sendServer(api_req).subscribe((res: any) => {
      if (res?.datas?.taxes && Array.isArray(res.datas.taxes)) {
        this.taxList = res.datas.taxes;
        this.itemsArray.controls.forEach((_, i) => {
          this.itemsTaxOptions[i] = this.taxList;
        });
      }
    });
  }
  searchZohoItems(keyword: string, rowIndex: number) {
    if (!keyword || keyword.length < 0) {
      this.itemSuggestions = [];
      return;
    }

    this.activeItemRowIndex = rowIndex;

    const api_req = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/getZohoItems',
      // search: keyword || ''
    };

    this.serverService.sendServer(api_req).subscribe((res: any) => {
      this.itemSuggestions = res?.datas?.items || [];
    });
  }


  selectItem(item: any, index: number) {
    const row = this.itemsArray.at(index);
    const rate = +item?.rate || 0;
    row.patchValue({
      itemDetails: item.name,
      item_id: item.item_id,
      //rate: item.rate || 0,
      quantity: 1,
      rate,
      unit: item.unit,
      product_type: item.product_type || '',
      hsn_or_sac: item.hsn_or_sac || '',
      description: item.description || '',
      discount: 0,
      amount: rate,
      tax: item?.item_tax_preferences?.[0]?.tax_id || '',
      tax_name: item?.item_tax_preferences?.[0]?.tax_name || '',
      tax_percentage: item?.item_tax_preferences?.[0]?.tax_percentage || '',
      taxGroup: [] // reset previous tax
      //tax: this.getDefaultTax(item)
    }, { emitEvent: false });

    this.itemSuggestions = [];
    this.activeItemRowIndex = null;
    const taxId = row.get('tax')?.value;
    if (taxId) {
      this.fetchTaxGroupForRow(taxId, index);
    } else {
      this.recalculateInvoice();
    }
  }


  getDefaultTax(item: any): string {
    if (item.item_tax_preferences?.length) {
      return item.item_tax_preferences[0].tax_id;
    }
    return '';
  }

  getItemImage(item: any): string {
    return `https://books.zoho.com/api/v3/items/${item.item_id}/image`;
  }

  getEstimateCode() {
    this.http.get<{ next_invoice: string }>('https://chettinadlink.cal4care.com/api/zoho/getEstimateCode')
      .subscribe({
        next: (res) => {
          // assuming API returns { nextInvoice: "INV-00123" }
          this.estimateForm.patchValue({ estimateNo: res.next_invoice });
        },
        error: (err) => {
          console.error('Error fetching next invoice number', err);
        }
      });
  }
  onCustomerSelect(customerId: string) {
    if (!customerId) {
      this.customerDetails = false;
      return;
    }
    this.isLoading = true;
    const api_req: any = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/getZohoCustomerDetail',
      contact_id: customerId
    };

    this.serverService.sendServer(api_req).subscribe((res: any) => {
      this.isLoading = false;
      if (res?.type === 'single') {
        this.customerDetails = res;
        this.estimateForm.patchValue({
          termsAndConditions: res.getTermsandcondition || ''
        });
        this.billingAddress = res.billing_address;
        this.shippingAddress = res.shipping_address;
        this.currencyCode = res.currency_code;
        this.currencyId = res.currency_id;
        this.gstTreatment = this.formatGST(res.gst_treatment);
        // this.placeOfSupply = res.place_of_supply || '[TN] - Tamil Nadu';
        this.salespersonList = res.getSalespersons || [];
        this.stateList = res.stateList || [];
        this.tdsList = res.tdsList || [];
        // 2️⃣ Default TN
        let selectedState = this.stateList.find((s: string) => s.startsWith('[TN]')) || '';

        // 3️⃣ Override using billing address (Tamil Nadu → [TN] - Tamil Nadu)
        const billingState = res.billing_address?.state;
        if (billingState) {
          const match = this.stateList.find((s: string) => {
            const stateName = s.split(' - ')[1];
            return stateName === billingState;
          });
          if (match) {
            selectedState = match; // Set the matched state
          }
        }

        // 4️⃣ SET VALUE (Reactive Form)
        this.estimateForm.patchValue({
          placeOfSupply: selectedState
        });
      }
    });
  }

  formatGST(value: string) {
    return value === 'business_none'
      ? 'Unregistered Business'
      : value;
  }


  // calculateRowAmount(index: number) {
  //   const row = this.itemsArray.at(index);

  //   const qty = +row.get('quantity')!.value || 0;
  //   const rate = +row.get('rate')!.value || 0;
  //   const discount = +row.get('discount')!.value || 0;

  //   const amount = qty * rate - discount;
  //   row.patchValue({ amount }, { emitEvent: false });

  //   const taxId = row.get('tax')!.value;

  //   if (taxId) {
  //     this.fetchTaxGroupForRow(taxId, index);
  //   } else {
  //     this.recalculateInvoice();
  //   }
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

    this.calculateSubTotal();
  }


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
      const amount = +row.get('amount')!.value || 0;
      const taxes = row.get('taxGroup')!.value || [];

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

    const taxTotal = this.taxSummary.reduce(
      (sum: number, t: any) => sum + t.amount,
      0
    );

    const adjustment = +this.adjustment?.value || 0;

    this.grandTotal = this.subTotal + taxTotal + adjustment;
  }


  // Fetch Tax Group from API
  fetchTaxGroupForRow(taxId: string, index: number) {
    const payload = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/getTaxGroupsValue',
      tax_id: taxId
    };

    this.serverService.sendServer(payload).subscribe((res: any) => {
      const taxes = res?.data?.tax_group?.taxes || [];

      // ✅ save tax group to row
      this.itemsArray.at(index).patchValue(
        { taxGroup: taxes },
        { emitEvent: false }
      );

      this.recalculateInvoice(); // 🔥 REQUIRED
    });
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
    if (this.estimateForm.get('taxType')?.value === 'TDS') {
      const selectedTds = this.estimateForm.get('tds')?.value;

      if (selectedTds && selectedTds.tax_percentage) {
        this.tdsAmount =
          (this.subTotal * Number(selectedTds.tax_percentage)) / 100;
      }
    }

    // Final total
    this.grandTotal =
      this.subTotal + taxTotal + adjustmentAmount - this.tdsAmount;
  }





  onFileSelect(event: any) {
    const selectedFiles = Array.from(event.target.files) as File[];

    for (let file of selectedFiles) {
      if (this.files.length >= 5) {
        iziToast.error({
          message: 'Maximum 5 files allowed',
          position: 'topRight',
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        iziToast.error({
          message: `${file.name} exceeds 10MB`,
          position: 'topRight',
        });
        return;
      }

      this.files.push(file);
    }

    event.target.value = '';
  }

  removeFile(index: number) {
    this.files.splice(index, 1);
  }
  createItemRow() {
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
      tax_name: [''], 
      tax_percentage: [0],
      amount: [0],
      taxGroup: [[]]
    });
  }

  // -------- Get Items Array ----------
  get itemsArray() {
    return this.estimateForm.get('items') as FormArray;
  }

  // -------- Add New Single Row ----------
  addNewRow() {
    this.itemsArray.push(this.createItemRow());
    const i = this.itemsArray.length - 1;
    this.itemsTaxOptions[i] = [...this.taxList];
  }


  // -------- Add Bulk Rows (5 rows) ----------
  addBulkRows() {
    for (let i = 0; i < 5; i++) {
      this.itemsArray.push(this.createItemRow());
    }
  }

  // -------- Remove Row ----------
  deleteRow(i: number) {
    this.itemsArray.removeAt(i);
    this.itemsTaxOptions.splice(i, 1);
    this.estimateForm.get('tds')?.reset();
    this.calculateSubTotal();
  }

  // Save Form
  onSave() {

    this.estimateForm.markAllAsTouched();

    /* -------------------- BASIC VALIDATIONS -------------------- */
    if (!this.estimateForm.value.customerName) {
      iziToast.warning({ message: 'Please select Customer Name', position: 'topRight' });
      return;
    }

    if (!this.estimateForm.value.estimateNo) {
      iziToast.warning({ message: 'Please enter Estimate Number', position: 'topRight' });
      return;
    }

    if (!this.estimateForm.value.estimateDate) {
      iziToast.warning({ message: 'Please select Estimate Date', position: 'topRight' });
      return;
    }

    if (this.itemsArray.length === 0) {
      iziToast.warning({ message: 'At least one item is required', position: 'topRight' });
      return;
    }

    /* -------------------- LINE ITEM VALIDATION -------------------- */
    for (let i = 0; i < this.itemsArray.length; i++) {
      const row = this.itemsArray.at(i).value;

      if (!row.itemDetails) {
        iziToast.warning({ message: `Item required in row ${i + 1}`, position: 'topRight' });
        return;
      }

      if (!row.quantity || row.quantity < 1) {
        iziToast.warning({ message: `Quantity must be ≥ 1 in row ${i + 1}`, position: 'topRight' });
        return;
      }

      if (!row.rate || row.rate <= 0) {
        iziToast.warning({ message: `Rate must be > 0 in row ${i + 1}`, position: 'topRight' });
        return;
      }

      if (!row.tax) {
        iziToast.warning({ message: `Tax required in row ${i + 1}`, position: 'topRight' });
        return;
      }
    }
    const placeOfSupplyFull = this.estimateForm.value.placeOfSupply;
    const placeOfSupplyCodeMatch = placeOfSupplyFull?.match(/\[(.*?)\]/);
    const placeOfSupplyCode = placeOfSupplyCodeMatch ? placeOfSupplyCodeMatch[1] : '';
    const form = this.estimateForm.getRawValue();
    let tdsData = null;
    if (form.taxType === 'TDS' && form.tds) {
      tdsData = {
        tax_name: form.tds.tax_name,
        section: form.tds.section,
        tax_percentage: form.tds.tax_percentage,
        amount: this.tdsAmount || 0
      };
    }

    /* -------------------- BUILD LINE ITEMS -------------------- */

    const line_items = this.itemsArray.controls.map((row: any, index: number) => {
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
        item_id: row.get('item_id')?.value || '',
        name: row.get('itemDetails')?.value,
        unit: row.get('unit')?.value,
        hsn_or_sac: row.get('hsn_or_sac')?.value,
        product_type: row.get('product_type')?.value,
        description: row.get('description')?.value || '',
        discount: discount,
        discountType: discountType,
        discount_amount: Number(discount_amount.toFixed(2)),
        rate: Number(row.get('rate')?.value),
        quantity: Number(row.get('quantity')?.value),
        tax_id: row.get('tax')?.value,
        tax_name: row.get('tax_name')?.value,
        tax_percentage:row.get('tax_percentage')?.value,
        item_total:item_total,
        item_order: index + 1
      };
    });



    /* -------------------- BUILD ZOHO PAYLOAD -------------------- */
    const invoiceData = {
      customer_id: this.estimateForm.value.customerName,
      estimate_number: this.estimateForm.value.estimateNo,
      reference_number: this.estimateForm.value.referenceNo || '',
      date: this.estimateForm.value.estimateDate,
      expiry_date: this.estimateForm.value.expiryDate || '',
      salesperson_name: this.estimateForm.value.salesperson || '',
      place_of_supply: placeOfSupplyCode,
      gst_treatment: this.gstTreatment,
      currency_id: this.currencyId,
      exchange_rate: 1,
      discount: 0,
      is_discount_before_tax: true,
      discount_type: 'item_level',
      is_inclusive_tax: false,
      line_items: line_items,
      notes: this.estimateForm.value.customerNotes || '',
      terms: this.estimateForm.value.termsAndConditions || '',
      shipping_charge: 0,
      adjustment: this.adjustment?.value || 0,
      tds: tdsData,
    };

    /* -------------------- FINAL API REQUEST -------------------- */
    const api_req = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/create_quotation',
      invoiceData: invoiceData
    };
    // console.log(api_req)
    // return
    this.isLoading = true;

    /* -------------------- API CALL -------------------- */
    this.serverService.sendServer(api_req).subscribe(
      (response: any) => {
        this.isLoading = false;
        if (response?.status === true || response?.estimate_id) {
          iziToast.success({
            message: response?.message || 'Estimate created successfully',
            position: 'topRight'
          });
          this.onCancel();
        } else {
          iziToast.warning({
            message: response?.message || 'Estimate creation failed',
            position: 'topRight'
          });
        }
      },
      (error: any) => {
        this.isLoading = false;
        iziToast.error({
          message: error?.error?.error || error?.message || 'Server error. Please try again later',
          position: 'topRight'
        });
      }
    );
  }



  // Cancel → Reset form
  onCancel() {
    this.estimateForm.reset();
    this.itemsArray.clear();
    this.itemsArray.push(this.createItemRow());
    this.router.navigate(['/Quotation']);
  }

}
