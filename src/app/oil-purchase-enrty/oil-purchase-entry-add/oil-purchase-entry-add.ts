import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule,FormGroup,FormBuilder,Validators,ReactiveFormsModule } from '@angular/forms';
import { Server } from '../../server';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import iziToast from 'izitoast';
declare var $: any;

@Component({
  selector: 'app-oil-purchase-entry-add',
  imports: [CommonModule, FormsModule, NgSelectModule,ReactiveFormsModule],
  templateUrl: './oil-purchase-entry-add.html',
  styleUrl: './oil-purchase-entry-add.css'
})
export class OilPurchaseEntryAdd implements OnInit {

  isLoading: boolean = false;
  selectedProduct: any = '';
  selectedVendor1: any = '';
  selectedVendor2: any = '';
  selectedGst: any = '';
  productPriceValue: any = '0.00';
  productBasePriceValue: any = '0.00';
  productTotalValue: any = '0.00';
  productLiter: any = '0.00';
  todayPurchase: any = '0.00';
  deliveryCharge: any = '0.00';
  productNameList: any[] = [];
  vendorNameList: any[] = [];
  gstNameList: any[] = [];

  selectedFile: File | null = null;
  selectedVendorFile: File | null = null;
  // calculation

  // three GST selectors
  selectedTnvat: any = '';
  selectedVatLsi: any = '';
  selectedTcs: any = '';
  // initial values
  serial_number: any = '';
  qty: number = 0;
  tnvatRate: number = 0.00;
  vatLsiRate: number = 0.00;
  tcsRate: number = 0.00;
  total: number = 0.00;
  vendorAmount: any = '0.00';
  grossTotal: number = 0.00;
  tnvatAmt: number = 0.00;
  vatLsiAmt: number = 0.00;
  tcsAmt: number = 0.00;

  disablePrice: boolean = false;

  oilEntry: any[] = [{
    selectedProduct: null,
    selectedVendor: null,
    serial_number: '',
    qty: 0,
    productPriceValue: 0,
    productBasePriceValue: 0,
    productTotalValue: 0,
    productLiter: 0,
    selectedTnvat: '',
    selectedVatLsi: '',
    selectedTcs: '',
    tnvatAmt: 0,
    vatLsiAmt: 0,
    tcsAmt: 0,
    total: 0
  }];

  vendorForm!: FormGroup;
  customer_code: any;
  errorMessage: string = '';

  constructor(private serverService: Server, private fb: FormBuilder, private http: HttpClient, private location: Location, private router: Router) { }

  ngOnInit(): void {
    this.vendorForm = this.fb.group({
      company_name: ['', Validators.required],
      company_code: [''],
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
    this.getProductName();
    this.getVendorName();
    this.gstDropDown();
  }

  onProductChange() {
    if (!this.selectedProduct) return;
    this.gstPriceValue(this.selectedProduct.id);
  }
   home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
  getProductName() {

    this.isLoading = true;
    let requestData: any = {
      api_url: 'getproducts'
    }
    this.serverService.sendServerGet(requestData).subscribe({
      next: (response: any) => {
        if (response.status === true || response.status === 'true') {
          this.productNameList = response.data;
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  getVendorName() {

    this.isLoading = true;
    let requestData: any = {
      api_url: 'getvendors'
    }
    this.serverService.sendServerGet(requestData).subscribe({
      next: (response: any) => {
        if (response.status == true || response.status === 'true') {
          // this.vendorNameList = response.data
          this.vendorNameList = response.data.filter((item: { oil: number; }) => item.oil === 1);
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error(error);
        this.isLoading = false;
      }
    });

  }

  gstDropDown() {

    this.isLoading = true;
    let requestData: any = {
      api_url: 'gettaxes'
    }
    this.serverService.sendServerGet(requestData).subscribe({
      next: (response: any) => {

        if (response.status === true || response.status === 'true') {
          this.gstNameList = response.data;
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error(error);
        this.isLoading = false;
      }
    });

  }

  gstPriceValue(i: number) {
    const row = this.oilEntry[i];
    const productId = row.selectedProduct.id;

    // For MS or HSD → reset form and disable price input
    if (productId === 'MS' || productId === 'HSD') {
      this.resetPurchaseEntryForm();
      this.disablePrice = true;
      return;
    }

    // this.resetPurchaseEntryForm();
    this.disablePrice = false;
    this.isLoading = true;

    const requestData = {
      api_url: 'getproductRate',
      id: productId
    };

    this.serverService.sendServerGetID(requestData).subscribe({
      next: (response: any) => {
        if (response?.status === true || response?.status === 'true') {
          // ✅ assign directly to the row
          row.productPriceValue = Number(response.data.rate) || 0.00;
        } else {
          row.productPriceValue = 0.00;
        }
        this.calculateTotal(i);   // 🔥 recalc totals for that row
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error fetching product rate:', error);
        row.productPriceValue = 0.00;
        this.calculateTotal(i);
        this.isLoading = false;
      }
    });
  }



  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }
  onVendorFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedVendorFile = event.target.files[0];
    }
  }

  // CALCULATION 

  onTnvatChange(i: number) {
    const row = this.oilEntry[i];
    const gst = this.gstNameList.find(g => g.id == row.selectedTnvat);
    row.tnvatRate = gst ? gst.percentage : 0;
    this.calculateTotal(i);
  }

  onVatLsiChange(i: number) {
    const row = this.oilEntry[i];
    const gst = this.gstNameList.find(g => g.id == row.selectedVatLsi);
    row.vatLsiRate = gst ? gst.percentage : 0;
    this.calculateTotal(i);
  }

  onTcsChange(i: number) {
    const row = this.oilEntry[i];
    const gst = this.gstNameList.find(g => g.id == row.selectedTcs);
    row.tcsRate = gst ? gst.percentage : 0;
    this.calculateTotal(i);
  }

  onAmountBlur(field: 'vendorAmount' | 'productPriceValue' | 'productTotalValue' | 'productLiter' | 'todayPurchase' | 'productBasePriceValue' | 'deliveryCharge') {
    let value = parseFloat(this[field] as string || '0'); // force cast to string
    if (isNaN(value) || value < 0) value = 0;  // only prevent negative
    (this as any)[field] = value.toFixed(2);   // force 2 decimals as string
    this.calculateTotal();
  }

  calculateTotal(i?: number) {
    if (i !== undefined) {
      // calculate for that single row
      const row = this.oilEntry[i];

      const qty = Number(row.qty) || 0;
      const productPrice = Number(row.productPriceValue) || 0;
      const productLiter = Number(row.productLiter) || 0;

      // Base calculation
      row.productTotalValue = (Number(row.productBasePriceValue) || 0) * productLiter / 1000;
      const productTotal = Number(row.productTotalValue) || 0;

      row.base = qty * productPrice;
      // VAT calculations
      if (productLiter !== 0) {
        row.tnvatAmt = (productLiter * (Number(row.tnvatRate) || 0)) / 100;
        row.vatLsiAmt = ((productTotal + row.base) * (Number(row.vatLsiRate) || 0)) / 100;
      } else {
        row.tnvatAmt = (row.base * (Number(row.tnvatRate) || 0)) / 100;
        row.vatLsiAmt = (row.base * (Number(row.vatLsiRate) || 0)) / 100;
      }

      // TCS → on Base + VATs + productTotal
      const tcsBase = row.base + row.tnvatAmt + row.vatLsiAmt + productTotal;
      row.tcsAmt = (tcsBase * (Number(row.tcsRate) || 0)) / 100;

      // Final total (safe Number wrappers)
      row.total =
        (Number(row.base) || 0) +
        (Number(row.tnvatAmt) || 0) +
        (Number(row.vatLsiAmt) || 0) +
        (Number(row.tcsAmt) || 0) +
        (Number(productTotal) || 0);

      // Format values
      row.productTotalValue = Number(productTotal.toFixed(2));
      row.tnvatAmt = Number(row.tnvatAmt.toFixed(2));
      row.vatLsiAmt = Number(row.vatLsiAmt.toFixed(2));
      row.tcsAmt = Number(row.tcsAmt.toFixed(2));
      row.total = Number(row.total.toFixed(2));
    }

    // 🔽 Aggregate across all rows
    this.total = this.oilEntry.reduce((sum, row) => sum + (Number(row.total) || 0), 0);

    // Add vendor charges
    const vendor = Number(this.vendorAmount) || 0;
    const delivery = Number(this.deliveryCharge) || 0;
    this.grossTotal = this.total + vendor + delivery;

    // Per-liter purchase cost (if product liters entered)
    const totalLiters = this.oilEntry.reduce((sum, row) => sum + (Number(row.productLiter) || 0), 0);
    // this.todayPurchase = totalLiters > 0 ? this.grossTotal / totalLiters : 0;

    // Format
    this.total = Number(this.total.toFixed(2));
    this.grossTotal = Number(this.grossTotal.toFixed(2));
    // this.todayPurchase = Number(this.todayPurchase.toFixed(2));

  }

  addCustomer(): void {
    this.oilEntry.push({
      selectedProduct: null,
      selectedVendor: null,
      serial_number:'',
      qty: 0,
      productPriceValue: 0,
      productBasePriceValue: 0,
      productTotalValue: 0,
      productLiter: 0,
      selectedTnvat: '',
      tnvatRate: 0,
      tnvatAmt: 0,
      selectedVatLsi: '',
      vatLsiRate: 0,
      vatLsiAmt: 0,
      selectedTcs: '',
      tcsRate: 0,
      tcsAmt: 0,
      total: 0
    });
  }

  removeCust(i: number): void {
    if (this.oilEntry.length > 0) {
      this.oilEntry.splice(i, 1);
    }
  }

  // calculateTotal() {
  //   const qty = Number(this.qty) || 0;
  //   const productPrice = Number(this.productPriceValue) || 0;
  //   const productLiter = Number(this.productLiter) || 0.00;
  //   this.productTotalValue = Number(this.productBasePriceValue * productLiter) || 0;

  //   const productTotal = Number((this.productTotalValue).toFixed(2)) || 0.00;


  //   const base = qty * productPrice;

  //   if (productLiter !== 0) {
  //     this.tnvatAmt = Number((productLiter * this.tnvatRate).toFixed(2));
  //     this.vatLsiAmt = ((productTotal + base) * (Number(this.vatLsiRate) || 0)) / 100;
  //     this.tcsAmt = ((productTotal + this.tnvatAmt + this.vatLsiAmt + base) * (Number(this.tcsRate) || 0)) / 100;
  //   } else {
  //     this.tnvatAmt = Number(((base * this.tnvatRate) / 100).toFixed(2));
  //     this.vatLsiAmt = ((productTotal + base) * (Number(this.vatLsiRate) || 0)) / 100;
  //     this.tcsAmt = ((productTotal + base) * (Number(this.tcsRate) || 0)) / 100;
  //   }



  //   const vendor = Number(this.vendorAmount) || 0.00;

  //   const totalVal = productTotal + base + this.tnvatAmt + this.vatLsiAmt + this.tcsAmt;
  //   this.total = Number(totalVal.toFixed(2));

  //   this.grossTotal = Number((this.total + vendor).toFixed(2));

  //   this.todayPurchase = Number((this.grossTotal / productLiter).toFixed(2));
  // }

  submitPurchaseEntry() {

    this.isLoading = true;

    var date = $('#date').val();
    if (!date) {
      iziToast.error({ message: 'Select the Date', position: 'topRight' });
      this.isLoading = false;
      return false;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    if (selectedDate > today) {
      iziToast.error({ message: 'Future dates are not allowed', position: 'topRight' });
      this.isLoading = false;
      return false;
    }

    // Validate table rows
    if (!this.oilEntry || this.oilEntry.length === 0) {
      iziToast.error({ message: 'Add at least one product row', position: 'topRight' });
      this.isLoading = false;
      return false;
    }

    for (let i = 0; i < this.oilEntry.length; i++) {
      const row = this.oilEntry[i];

      if (!row.selectedProduct) {
        iziToast.error({ message: `Select a product in row ${i + 1}`, position: 'topRight' });
        this.isLoading = false;
        return false;
      }

      if (!row.selectedVendor) {
        iziToast.error({ message: `Select a vendor in row ${i + 1}`, position: 'topRight' });
        this.isLoading = false;
        return false;
      }

      if (!row.qty || row.qty <= 0) {
        iziToast.error({ message: `Enter a valid quantity in row ${i + 1}`, position: 'topRight' });
        this.isLoading = false;
        return false;
      }
      if (!row.productPriceValue || row.productPriceValue <= 0) {
        iziToast.error({ message: `Enter a valid Price in row ${i + 1}`, position: 'topRight' });
        this.isLoading = false;
        return false;
      }
    }


    // Validate vendorAmount
    // if (!this.vendorAmount || this.vendorAmount <= 0) {
    //   iziToast.error({ message: 'Enter Transport Amount', position: 'topRight' });
    //   this.isLoading = false;
    //   return false;
    // }


    const accessToken = localStorage.getItem('access_token');

    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
    };
    const formData: FormData = new FormData();

    formData.append("purchase_date", date || "");
    // Product details;
    console.log('this.oilEntry', this.oilEntry);

    const rows = this.oilEntry.map(row => ({
      product_id: row.selectedProduct?.id || "",
      product_name: row.selectedProduct?.name || "",
      vendor_id: row.selectedVendor?.id || "",
      vendor_name: row.selectedVendor?.vendor_name || "",
      serial_number:row.serial_number || "",
      qty: row.qty ?? 0,
      price: row.productPriceValue ?? 0.00,
      total: row.total ?? 0.00,
      total_liters: row.productLiter ?? 0.00,
      base_price: row.productBasePriceValue ?? 0.00,
      tnvat_id: row.selectedTnvat ?? '',
      vat_lsi_id: row.selectedVatLsi ?? '',
      tcs_id: row.selectedTcs ?? '',
      tnvat: row.tnvatAmt ?? 0.00,
      vat_lsi: row.vatLsiAmt ?? 0.00,
      tcs: row.tcsAmt ?? 0.00,
    }));

    // append JSON string to formData
    formData.append("rows", JSON.stringify(rows));

    // Transport values
    formData.append("purchase_cost", this.total?.toString() || "0.00");
    formData.append("transport_vendor", this.selectedVendor2?.id || "");
    formData.append("transport_vendor_name", this.selectedVendor2?.vendor_name || "");
    formData.append("net_total", this.vendorAmount?.toString() || "0.00");
    formData.append("gross_total", this.grossTotal?.toString() || "0.00");
    formData.append("delivery_charge", this.deliveryCharge?.toString() || "0.00");
    formData.append("today_purchase", this.todayPurchase?.toString() || "0.00");

    // File (if uploaded)
    if (this.selectedFile) {
      formData.append("file", this.selectedFile, this.selectedFile.name);
    }
    // File (if uploaded)
    if (this.selectedVendorFile) {
      formData.append("vendor_file", this.selectedVendorFile, this.selectedVendorFile.name);
    }
    // return false
    // for (const [key, value] of formData.entries()) {
    //   console.log(key, value);
    // }
    // return false;
    // Purchase Date
    // const today = new Date();
    // const formattedDate = today.toISOString().split('T')[0]; // yyyy-mm-dd
    // formData.append("purchase_date", formattedDate);

    // 🔥 Send API request
    this.http.post("https://chettinadlink.cal4care.com/api/oil-purchase-entries/oilpurchaseSave", formData, httpOptions)
      .subscribe({
        next: (response: any) => {

          if (response.status === true || response.status === 'true') {
            iziToast.success({
              message: response.message,
              position: 'topRight'
            });
            // this.resetPurchaseEntryForm();
            this.router.navigate(['/purchaseEntryReport']);
            this.isLoading = false;

          } else {

            iziToast.error({
              message: response.message,
              position: 'topRight'
            });
            this.isLoading = false;
          }

        },
        error: (error: any) => {
          console.error("Error while saving purchase entry ❌", error);
          this.isLoading = false;
        }
      });

    return true;
  }

  resetPurchaseEntryForm() {
    // this.selectedProduct = '';
    this.selectedVendor1 = '';
    this.selectedVendor2 = '';
    this.selectedGst = '';
    this.selectedTnvat = '';
    this.selectedVatLsi = '';
    this.selectedTcs = '';

    // Numeric fields (always reset to number, not string)
    this.serial_number = 0;
    this.qty = 0;
    this.productPriceValue = '0.00';
    this.productTotalValue = '0.00';
    this.total = 0.00;
    this.productLiter = '0.00';
    this.productBasePriceValue = '0.00';

    this.tnvatRate = 0.00;
    this.vatLsiRate = 0.00;
    this.tcsRate = 0.00;

    this.tnvatAmt = 0.00;
    this.vatLsiAmt = 0.00;
    this.tcsAmt = 0.00;

    this.vendorAmount = '0.00';
    this.grossTotal = 0.00;
    this.deliveryCharge = 0.00;
    this.todayPurchase = '0.00';

    // File reset
    this.selectedFile = null;
    const fileInput = document.querySelector<HTMLInputElement>('#fileInput');
    if (fileInput) {
      fileInput.value = "";
    }

    // Flags
    this.disablePrice = false;
  }


  onCancel() {
    // this.resetPurchaseEntryForm();
    this.location.back();
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
  addVenorModal() {
    $('#addModal').modal('show');
    this.getVendorCode();
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
          this.getVendorName();
          this.closevenorModal();
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
        this.closevenorModal();
      }
    });
  }
  closevenorModal() {
    this.vendorForm.reset();
    $('#addModal').modal('hide')
  }
}

