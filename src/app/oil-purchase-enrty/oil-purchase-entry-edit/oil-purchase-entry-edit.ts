import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,FormGroup,FormBuilder,Validators,ReactiveFormsModule } from '@angular/forms';
import { Server } from '../../server';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

import iziToast from 'izitoast';
declare var $: any;

interface OilEntryRow {
  selectedProduct: any;          // might be object {id, name}
  selectedVendor1: any;          // object {id, vendor_name}
  qty: number;
  serial_number: any;
  productPriceValue: number;
  productBasePriceValue: number;
  productTotalValue: number;
  productLiter: number;
  selectedTnvat: any;
  tnvatRate: number;
  tnvatAmt: number;
  selectedVatLsi: any;
  vatLsiRate: number;
  vatLsiAmt: number;
  selectedTcs: any;
  tcsRate: number;
  tcsAmt: number;
  total: number;
}

@Component({
  selector: 'app-oil-purchase-entry-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule,ReactiveFormsModule],
  templateUrl: './oil-purchase-entry-edit.html',
  styleUrl: './oil-purchase-entry-edit.css'
})
export class OilPurchaseEntryEdit implements OnInit {

  purchaseEntryID: any;

  isLoading: boolean = false;
  selectedProduct: any = '';
  selectedVendor1: any = '';
  selectedVendor2: any = '';
  selectedGst: any = '';
  productPriceValue: any = '';
  productTotalValue: any = '';
  productLiter: any = '';
  todayPurchase: any = '';

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
  qty: number = 0;
  serial_number = '';
  productBasePriceValue: any = 0.00;
  tnvatRate: any = 0.00;
  vatLsiRate: any = 0.00;
  tcsRate: any = 0.00;
  tnvatAmt: any = 0.00;
  vatLsiAmt: any = 0.00;
  tcsAmt: any = 0.00;
  total: any = 0.00;
  // transportAmount: number = 0.00;
  // vendorAmount: number = 0.00;
  transportAmount: any = '0.00';
  vendorAmount: any = '0.00';
  grossTotal: any = 0.00;

  fileUrl: string | null = null;   // for preview
  vendorFileUrl: string | null = null;   // for preview
  disablePrice: boolean = false;
  purchase_date: any;

  oilEntry: OilEntryRow[] = [];
  purchase_cost: any;

  vendorForm!: FormGroup;
  customer_code: any;
  errorMessage: string = '';
  deliveryCharge: any = '0.00';
  constructor(private serverService: Server, private fb: FormBuilder, private http: HttpClient, private route: ActivatedRoute, private router: Router, private location: Location) { }

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      this.purchaseEntryID = params['purchaseEntryID'];
    });
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
      //  gas: [''],
      oil: [''],
      expense: [''],
      transport: [''],
    });

    // this.getProductName();
    // this.getVendorName();
    this.gstDropDown();
    // this.editPurchaseEntry();
    this.loadVendorsAndProductsThenEdit();


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
          //this.vendorNameList = response.data
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
        this.calculateTotal(row);   // 🔥 recalc totals for that row
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error fetching product rate:', error);
        row.productPriceValue = 0.00;
        this.calculateTotal(row);
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

  /** Calculate totals for one row */

  calculateTotal(row?: any) {

    if (row !== undefined) {
      const qty = Number(row.qty) || 0;
      const productPrice = Number(row.productPriceValue) || 0;
      const productLiter = Number(row.productLiter) || 0;

      // product total
      row.productTotalValue = (row.productBasePriceValue * productLiter / 1000).toFixed(2);
      const productTotal = Number(row.productTotalValue) || 0;

      var base = Number(((qty * productPrice) + productTotal).toFixed(2));

      row.tnvatAmt = 0;
      row.vatLsiAmt = 0;
      row.tcsAmt = 0;

      // TNVAT
      if (row.selectedTnvat) {
        const tnvatObj = this.gstNameList.find(g => g.id == row.selectedTnvat);
        if (tnvatObj) {
          row.tnvatRate = tnvatObj.percentage;
          row.tnvatAmt = productLiter !== 0
            ? Number((productLiter * row.tnvatRate).toFixed(2))
            : Number(((base * row.tnvatRate) / 100).toFixed(2));
        }
      }

      // VAT LSI
      if (row.selectedVatLsi) {
        const vatLsiObj = this.gstNameList.find(g => g.id == row.selectedVatLsi);
        if (vatLsiObj) {
          row.vatLsiRate = vatLsiObj.percentage;
          row.vatLsiAmt = productLiter !== 0
            ? Number(((productTotal) * row.vatLsiRate / 100).toFixed(2))
            : Number(((base * row.vatLsiRate) / 100).toFixed(2));
        }
      }

      // TCS
      if (row.selectedTcs) {
        const tcsObj = this.gstNameList.find(g => g.id == row.selectedTcs);
        if (tcsObj) {
          row.tcsRate = tcsObj.percentage;
          row.tcsAmt = productLiter !== 0
            ? Number(((row.tnvatAmt + row.vatLsiAmt + base) * row.tcsRate / 100).toFixed(2))
            : Number(((base * row.tcsRate) / 100).toFixed(2));
        }
      }
      row.total = Number((base + row.tnvatAmt + row.vatLsiAmt + row.tcsAmt).toFixed(2));
    }
    // const transport = Number(row.transportAmount) || 0;
    // const vendor = Number(row.vendorAmount) || 0;
    this.purchase_cost = this.oilEntry.reduce((sum, row) => sum + (Number(row.total) || 0), 0);

    // row.grossTotal = Number((row.total + transport + vendor).toFixed(2));
    // Calculate grand totals
    this.grossTotal = this.oilEntry.reduce((acc: number, item: any) => acc + (item.total || 0), 0);
    const delivery = Number(this.deliveryCharge) || 0;
    this.grossTotal = Number((this.grossTotal + Number(this.transportAmount) + Number(this.vendorAmount) + delivery).toFixed(2));
  }

  /** On TNVAT Change */
  onTnvatChange(row: any) {
    const gst = this.gstNameList.find(g => g.id == row.selectedTnvat);
    row.tnvatRate = gst ? gst.percentage : 0;
    this.calculateTotal(row);
  }

  /** On VAT LSI Change */
  onVatLsiChange(row: any) {
    const gst = this.gstNameList.find(g => g.id == row.selectedVatLsi);
    row.vatLsiRate = gst ? gst.percentage : 0;
    this.calculateTotal(row);
  }

  /** On TCS Change */
  onTcsChange(row: any) {
    const gst = this.gstNameList.find(g => g.id == row.selectedTcs);
    row.tcsRate = gst ? gst.percentage : 0;
    this.calculateTotal(row);
  }


  onAmountBlur(field: 'vendorAmount' | 'productPriceValue' | 'productTotalValue' | 'productLiter' | 'todayPurchase' | 'productBasePriceValue'| 'deliveryCharge') {
    let value = parseFloat(this[field] as string || '0'); // force cast to string
    if (isNaN(value) || value < 0) value = 0;  // only prevent negative
    (this as any)[field] = value.toFixed(2);   // force 2 decimals as string
    this.calculateTotal();
  }

  private createEmptyRow(): OilEntryRow {
    return {
      selectedProduct: null,
      selectedVendor1: null,
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
    };
  }

  addCustomer() {
    this.oilEntry.push(this.createEmptyRow());
  }

  removeCust(index: number) {
    if (this.oilEntry.length > 1) {
      this.oilEntry.splice(index, 1);
      this.calculateTotal();
    } else {
      // maybe leave one row minimum
      iziToast.error({ message: 'At least one row required', position: 'topRight' });
    }

  }


  isImageFile(fileUrl: string): boolean {
    if (!fileUrl) return false;
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileUrl);
  }

  getFileName(fileUrl: string): string {
    return fileUrl.split('/').pop() || 'Download File';
  }
  isImageVendorFile(vendorFileUrl: string): boolean {
    if (!vendorFileUrl) return false;
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(vendorFileUrl);
  }

  getVendorFileName(vendorFileUrl: string): string {
    return vendorFileUrl.split('/').pop() || 'Download File';
  }


  loadVendorsAndProductsThenEdit() {
    this.isLoading = true;

    // Step 1: Get vendors
    const vendorRequestData = { api_url: 'getvendors' };
    this.serverService.sendServerGet(vendorRequestData).subscribe({
      next: (vendorRes: any) => {
        if (vendorRes.status === true || vendorRes.status === 'true') {
          // this.vendorNameList = vendorRes.data;
          this.vendorNameList = vendorRes.data.filter((item: { oil: number; }) => item.oil === 1);
          // Step 2: Get products
          const productRequestData = { api_url: 'getproducts' };
          this.serverService.sendServerGet(productRequestData).subscribe({
            next: (productRes: any) => {
              if (productRes.status === true || productRes.status === 'true') {
                this.productNameList = productRes.data;

                // Step 3: Now safely call editPurchaseEntry
                this.editPurchaseEntry();
              }
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Error loading products', err);
              this.isLoading = false;
            }
          });

        } else {
          console.warn('Vendor list failed to load.');
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error loading vendors', err);
        this.isLoading = false;
      }
    });
  }


  editPurchaseEntry() {
    this.isLoading = true;

    this.serverService.sendServerPurchaseEntryGET({
      moduleType: 'oil-purchase-entries',
      api_url: 'oilpurchaseEdit',
      id: this.purchaseEntryID
    }).subscribe({
      next: (response: any) => {
        if (response.status === true || response.status === 'true') {
          const data = response.data;

          // Summary Fields
          this.purchase_date = data.purchase_date;
          this.vendorAmount = Number(data.net_total) || 0;
          this.transportAmount = Number(data.transport_charge) || 0;
          this.grossTotal = Number(data.gross_total) || 0;
          this.todayPurchase = Number(data.today_purchase) || 0;
          this.purchase_cost = Number(data.purchase_cost) || 0;
          this.deliveryCharge = Number(data.delivery_charge) || 0;
          this.selectedVendor2 = data.transport_vendor
            ? this.vendorNameList.find(v => v.id == data.transport_vendor)
            : null;

          // file preview
          this.fileUrl = data.file_url;   // existing file preview
          this.selectedFile = null;
          // file preview
          this.vendorFileUrl = data.vendor_file_url;   // existing file preview
          this.selectedVendorFile = null;

          // Item Rows
          this.oilEntry = (data.items || []).map((item: any) => {
            const selectedProduct = this.productNameList.find(p => p.id == item.product_id) || null;
            const selectedVendor1 = this.vendorNameList.find(v => String(v.id) === String(item.vendor_id)) || null;
            // console.log('Vendor list:', this.vendorNameList);
            // console.log('Looking for vendor id:', item.vendor_id);
            return {
              selectedProduct,
              selectedVendor1,
              serial_number: Number(item.serial_number) || '',
              qty: Number(item.qty) || 0,
              productPriceValue: Number(item.price) || 0,
              productBasePriceValue: Number(item.base_price) || 0,
              productTotalValue: Number(item.total) || 0,
              productLiter: Number(item.total_liters) || 0,
              selectedTnvat: item.tnvat_id || '',
              tnvatRate: 0,
              tnvatAmt: Number(item.tnvat) || 0,
              selectedVatLsi: item.vat_lsi_id || '',
              vatLsiRate: 0,
              vatLsiAmt: Number(item.vat_lsi) || 0,
              selectedTcs: item.tcs_id || '',
              tcsRate: 0,
              tcsAmt: Number(item.tcs) || 0,
              total: Number(item.total) || 0
            };
          });

          // this.oilEntry.forEach(row => this.calculateTotal(row));
        }

        this.isLoading = false;
      },
      error: err => {
        console.error('Error fetching purchase entry:', err);
        this.isLoading = false;
      }
    });
  }


  UpdatePurchaseEntry() {


    this.isLoading = true;
    if (!this.purchase_date) {
      iziToast.error({ message: 'Select the Date', position: 'topRight' });
      this.isLoading = false;
      return false;
    }

    const selectedDate = new Date(this.purchase_date);
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

      if (!row.selectedVendor1) {
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

    // Build form data
    const formData: FormData = new FormData();
    formData.append("purchase_id", this.purchaseEntryID || "");
    formData.append("purchase_date", this.purchase_date);

    // Totals
     formData.append("delivery_charge", this.deliveryCharge?.toString() || "0.00");
    formData.append("net_total", this.vendorAmount?.toString() || "0.00");
    formData.append("gross_total", this.grossTotal?.toString() || "0.00");
    formData.append("today_purchase", this.todayPurchase?.toString() || "0.00");
    formData.append("transport_charge", this.transportAmount?.toString() || "0.00");
    formData.append("transport_vendor", this.selectedVendor2?.id || "");
    formData.append("transport_vendor_name", this.selectedVendor2?.vendor_name || "");

    // Rows (as JSON array)
    const rows = this.oilEntry.map(row => ({
      product_id: row.selectedProduct?.id || "",
      product_name: row.selectedProduct?.name || "",
      vendor_id: row.selectedVendor1?.id || "",
      vendor_name: row.selectedVendor1?.vendor_name || "",
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
    formData.append("rows", JSON.stringify(rows));

    if (this.selectedFile) {
      formData.append("file", this.selectedFile, this.selectedFile.name);
    }
    if (this.selectedVendorFile) {
      formData.append("vendor_file", this.selectedVendorFile, this.selectedVendorFile.name);
    }

    // Auth headers
    const accessToken = localStorage.getItem('access_token');
    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
    };
        // for (const [key, value] of formData.entries()) {
    //   console.log(key, value);
    // }
    // return false;

    this.http.post("https://chettinadlink.cal4care.com/api/oil-purchase-entries/oilpurchaseUpdate", formData, httpOptions)
      .subscribe({
        next: (response: any) => {

          if (response.status === true || response.status === 'true') {
            iziToast.success({
              message: response.message,
              position: 'topRight'
            });
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
  onCancel() {
    this.location.back()

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
    this.serial_number = '',
    this.qty = 0;
    this.productPriceValue = 0.00;
    this.productTotalValue = '0.00';
    this.total = 0.00;
    this.productLiter = '0.00';

    this.tnvatRate = 0.00;
    this.vatLsiRate = 0.00;
    this.tcsRate = 0.00;

    this.tnvatAmt = 0.00;
    this.vatLsiAmt = 0.00;
    this.tcsAmt = 0.00;

    this.vendorAmount = 0.00;
    this.grossTotal = 0.00;
    this.todayPurchase = '0.00';
    this.deliveryCharge = '0.00';

    // File reset
    this.selectedFile = null;
    const fileInput = document.querySelector<HTMLInputElement>('#fileInput');
    if (fileInput) {
      fileInput.value = "";
    }

    // Flags
    this.disablePrice = false;
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
