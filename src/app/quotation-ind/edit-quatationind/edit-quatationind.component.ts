import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Server } from '../../server';
import { HttpClient } from '@angular/common/http';
import iziToast from 'izitoast';

@Component({
  selector: 'app-edit-quatationind',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-quatationind.component.html',
  styleUrls: ['./edit-quatationind.component.css']
})
export class EditQuatationindComponent implements OnInit {
  isLoading: boolean = false;
  estimateForm!: FormGroup;
  files: File[] = [];
  customerList: any[] = [];
  customerDetails: any;
  billingAddress: any;
  shippingAddress: any;
  currencyCode = '';
  gstTreatment = '';
  taxSummary: any[] = [];
  itemsTaxOptions: any[][] = [];
  itemSuggestions: any[] = [];
  activeItemRowIndex: number | null = null;
  subTotal = 0;
  grandTotal = 0;
  adjustmentValue = 0;
  salespersonList: any;
  stateList: any;
  currencyId!: number;
  selectedCustomer: any = null;
  quotationId!: string;
  taxList: any;
  tdsAmount = 0;
  tdsList: any;
  constructor(
    private fb: FormBuilder,
    private serverService: Server,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.isLoading = false;
    this.quotationId = this.route.snapshot.paramMap.get('id')!;

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
      items: this.fb.array([this.createItemRow()], Validators.required),
      taxType: ['TDS'],
      tds: [null],
      adjustment: [0],
      customerNotes: [''],
      termsAndConditions: ['']
    });

    this.adjustment?.valueChanges.subscribe(() => this.calculateSubTotal());
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
    this.loadQuotation();
  }

  get adjustment() { return this.estimateForm.get('adjustment'); }
  get itemsArray() { return this.estimateForm.get('items') as FormArray; }
  home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
  // ---------------- GET CUSTOMERS ----------------
  getCustomers() {
    this.serverService.sendServer({
      moduleType: "zoho",
      api_type: "web",
      api_url: "zoho/customers"
    }).subscribe((res: any) => this.customerList = res?.data || []);
  }

  // ---------------- GET TAXES ----------------
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
  onCustomerSelect(customer: any) {
    this.selectedCustomer = customer;
    this.customerDetails = null;
    this.fetchCustomerDetails();
  }
  fetchCustomerDetails() {
    if (!this.selectedCustomer) return;

    this.isLoading = true;

    const api_req: any = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/getZohoCustomerDetail',
      contact_id: this.selectedCustomer.customer_id
    };

    this.serverService.sendServer(api_req).subscribe((res: any) => {
      this.isLoading = false;
      if (res?.type !== 'single') return;

      this.customerDetails = res;
      this.billingAddress = res.billing_address;
      this.shippingAddress = res.shipping_address;
      this.currencyCode = res.currency_code;
      this.currencyId = res.currency_id;
      this.gstTreatment = this.formatGST(res.gst_treatment);

      /* ✅ DROPDOWN DATA */
      this.salespersonList = res.getSalespersons || [];
      this.stateList = res.stateList || [];
      this.tdsList = res.tdsList || [];
      /* -------------------- PLACE OF SUPPLY MATCH -------------------- */
      let selectedState = this.stateList.find((s: string) =>
        s.startsWith(`[${this.estimateForm.value.placeOfSupply}]`)
      ) || '';

      this.estimateForm.patchValue({
        placeOfSupply: selectedState
      });

      /* -------------------- SALESPERSON MATCH -------------------- */
      const spName = this.estimateForm.value.salesperson;
      const exists = this.salespersonList.some(
        (sp: any) => sp.salesperson_name === spName
      );

      this.estimateForm.patchValue({
        salesperson: exists ? spName : ''
      });
    });
  }

  formatGST(value: string) {
    return value === 'business_none'
      ? 'Unregistered Business'
      : value;
  }

  selectItem(item: any, index: number) {
    const row = this.itemsArray.at(index);
    const rate = +item?.rate || 0;
    row.patchValue({
      item_id: item?.item_id,
      itemDetails: item.name,
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
  getItemImage(item: any): string {
    return `https://books.zoho.com/api/v3/items/${item.item_id}/image`;
  }

  // ---------------- LOAD EXISTING QUOTATION ----------------
  loadQuotation() {
    this.isLoading = true;

    const api_req = {
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/editQuatation',
      estimateId: this.quotationId
    };

    this.serverService.sendServer(api_req).subscribe((res: any) => {
      this.isLoading = false;
      if (!res?.estimate) return;

      const data = res.estimate;

      /* -------------------- Patch Header Form -------------------- */
      this.estimateForm.patchValue({
        customerName: data.customer_id,
        estimateNo: data.estimate_number,
        referenceNo: data.reference_number,
        estimateDate: data.date,
        expiryDate: data.expiry_date,
        salesperson: data.salesperson_name,   // PATCH NAME
        placeOfSupply: data.place_of_supply,   // PATCH TEMP (TN)
        customerNotes: data.notes,
        termsAndConditions: data.terms,
        adjustment: data.adjustment
      });

      /* -------------------- REQUIRED FIX -------------------- */
      this.selectedCustomer = {
        customer_id: data.customer_id,
        customer_name: data.customer_name
      };

      this.customerDetails = {
        customer_id: data.customer_id,
        customer_name: data.customer_name,
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
          itemDetails: item.name,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          hsn_or_sac: item.hsn_or_sac,
          discount: item.discount,
          unit: item.unit,
          product_type: item.product_type,
          discountType:item.discountType,
          tax: item.tax_id,
          tax_name: item.tax_name,
          tax_percentage: item.tax_percentage,
          amount: item.item_total,
          taxGroup: item.line_item_taxes
        }, { emitEvent: false });

        this.itemsArray.push(row);
        const rowIndex = this.itemsArray.length - 1;
        this.itemsTaxOptions[rowIndex] = this.taxList;
        if (item.tax_id) {
          this.fetchTaxGroupForRow(item.tax_id, this.itemsArray.length - 1);
        }
      });

      this.recalculateInvoice();
    });
  }



  // ---------------- CREATE ITEM ROW ----------------
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

  // ---------------- CALCULATION LOGIC ----------------
  // calculateRowAmount(index: number) {
  //   const row = this.itemsArray.at(index);
  //   const qty = +row.get('quantity')!.value || 0;
  //   const rate = +row.get('rate')!.value || 0;
  //   const discount = +row.get('discount')!.value || 0;
  //   row.patchValue({ amount: qty * rate - discount }, { emitEvent: false });
  //   const taxId = row.get('tax')!.value;
  //   if (taxId) this.fetchTaxGroupForRow(taxId, index);
  //   else this.recalculateInvoice();
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

  fetchTaxGroupForRow(taxId: string, index: number) {
    this.serverService.sendServer({
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/getTaxGroupsValue',
      tax_id: taxId
    }).subscribe((res: any) => {
      const taxes = res?.data?.tax_group?.taxes || [];
      this.itemsArray.at(index).patchValue(
        { taxGroup: taxes },
        { emitEvent: false }
      );
      this.recalculateInvoice();
    });
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
        // Handle BOTH API formats safely
        const rawName = tax.tax_name || tax.name;
        const taxType = rawName
          .replace(/\d+(\.\d+)?|\s*\(.*?\)/g, '')
          .trim();
        const taxPercent =
          tax.tax_percentage ??
          Number(rawName.match(/\(([\d.]+)%\)/)?.[1] || 0);

        const key = `${taxType}_${taxPercent}`;

        if (!taxMap[key]) {
          taxMap[key] = {
            type: taxType,
            percent: taxPercent,
            amount: 0
          };
        }

        taxMap[key].amount += (amount * taxPercent) / 100;
      });
    });

    this.subTotal = subTotal;
    this.taxSummary = Object.values(taxMap);

    const taxTotal = this.taxSummary.reduce(
      (sum: number, t: any) => sum + t.amount,
      0
    );

    const adjustment = +this.estimateForm.get('adjustment')?.value || 0;
    this.grandTotal = this.subTotal + taxTotal + adjustment;
  }


  // calculateSubTotal() { this.recalculateInvoice(); }
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

  // ---------------- ITEM ROW ACTIONS ----------------
  addNewRow() {
    this.itemsArray.push(this.createItemRow());
    const index = this.itemsArray.length - 1;
    this.itemsTaxOptions[index] = this.taxList;
  }
  // -------- Add Bulk Rows (5 rows) ----------
  addBulkRows() {
    for (let i = 0; i < 5; i++) {
      this.itemsArray.push(this.createItemRow());
    }
  }

  deleteRow(i: number) {
    this.itemsArray.removeAt(i);
    this.itemsTaxOptions.splice(i, 1);
    this.estimateForm.get('tds')?.reset();
    this.calculateSubTotal();
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
  // ---------------- SAVE / UPDATE ----------------
  onUpdate() {
    this.estimateForm.markAllAsTouched();
    const placeOfSupplyFull = this.estimateForm.value.placeOfSupply;
    const placeOfSupplyCodeMatch = placeOfSupplyFull?.match(/\[(.*?)\]/);
    const placeOfSupplyCode = placeOfSupplyCodeMatch
      ? placeOfSupplyCodeMatch[1]
      : '';
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
    // const line_items = this.itemsArray.value.map((row: any, index: number) => ({
      
    //   item_id: row.item_id || '',
    //   name: row.itemDetails,
    //   description: row.description || '',
    //   rate: Number(row.rate),
    //   quantity: Number(row.quantity),
    //   discount: Number(row.discount || 0),
    //   tax_id: row.tax,
    //   tax_name: row.get('tax_name')?.value,
    //   tax_percentage:row.get('tax_percentage')?.value,
    //   item_order: index + 1
    // }));
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

    const invoiceData = {
      zoho_estimate_id: this.quotationId,
      customer_id: Number(this.estimateForm.value.customerName),
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
      line_items,
      notes: this.estimateForm.value.customerNotes || '',
      terms: this.estimateForm.value.termsAndConditions || '',
      shipping_charge: 0,
      adjustment: this.adjustment?.value || 0,
      tds: tdsData,
    };
    /* ---------------- FORM DATA (IMPORTANT) ---------------- */
    const formData = new FormData();

    formData.append('invoiceData', JSON.stringify(invoiceData));

    /* ---------------- FILES ---------------- */
    this.files.forEach((file, index) => {
      formData.append('files[]', file, file.name);
    });
    this.serverService.sendServer({
      moduleType: 'zoho',
      api_type: 'web',
      api_url: 'zoho/update_quotation',
      invoiceData
    }).subscribe((res: any) => {
      if (res?.status === true) {
        iziToast.success({ message: 'Quotation updated successfully', position: 'topRight' });
        this.router.navigate(['/Quotation']);
      } else {
        iziToast.error({ message: 'Update failed', position: 'topRight' });
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

  onCancel() {
    this.estimateForm.reset();
    this.router.navigate(['/Quotation']);
  }

}
