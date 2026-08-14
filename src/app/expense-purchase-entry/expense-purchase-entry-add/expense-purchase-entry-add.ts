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
  selector: 'app-expense-purchase-entry-add',
  imports: [CommonModule, FormsModule, NgSelectModule,ReactiveFormsModule],
  templateUrl: './expense-purchase-entry-add.html',
  styleUrl: './expense-purchase-entry-add.css'
})
export class ExpensePurchaseEntryAdd implements OnInit {

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
  tnvatRate: number = 0.00;
  vatLsiRate: number = 0.00;
  tcsRate: number = 0.00;
  total: number = 0.00;
  vendorAmount: any = '0.00';
  grossTotal: number = 0.00;
  tnvatAmt: number = 0.00;
  vatLsiAmt: number = 0.00;
  tcsAmt: number = 0.00;

  productDescription: any;
  disablePrice: boolean = false;
  staffTaxDisable: boolean = false;

  vendorForm!: FormGroup;
  customer_code: any;
  errorMessage: string = '';
  staffList: any[] = [];
  selectedStaff: any = '';

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

  // onGstChange() {
  //   if (this.selectedProduct.name == 'Staff allowance') {

  //     this.selectedTnvat = '';
  //     this.selectedVatLsi = '';
  //     this.selectedTcs = '';

  //     this.tnvatRate = 0.00;
  //     this.vatLsiRate = 0.00;
  //     this.tcsRate = 0.00;

  //     this.tnvatAmt = 0.00;
  //     this.vatLsiAmt = 0.00;
  //     this.tcsAmt = 0.00;
  //     this.calculateTotal();
  //     this.staffTaxDisable = true;
  //   } else {
  //     this.staffTaxDisable = false;
  //   }

  // }
  onGstChange() {
  if (!this.selectedProduct) return;

  // 👉 Handle staff allowance
  if (this.selectedProduct.name === 'Staff allowance' || this.selectedProduct.id == 12 ||
    this.selectedProduct.name === 'Salary' || this.selectedProduct.id == 14
  ) {
    // Reset tax values
    this.selectedTnvat = '';
    this.selectedVatLsi = '';
    this.selectedTcs = '';

    this.tnvatRate = 0.00;
    this.vatLsiRate = 0.00;
    this.tcsRate = 0.00;

    this.tnvatAmt = 0.00;
    this.vatLsiAmt = 0.00;
    this.tcsAmt = 0.00;
    this.calculateTotal();

    this.staffTaxDisable = true;

    // 👉 Load staff list
    this.getStaffs();

  } else {
    // 👉 For all other products → enable taxes
    this.staffTaxDisable = false;

    // 👉 Load vendors
    this.getVendorName();
  }
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
      api_url: 'expenseType'
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
  getStaffs() {

    this.isLoading = true;
    let requestData: any = {
      api_url: 'getStaffs'
    }
    this.serverService.sendServerGet(requestData).subscribe({
      next: (response: any) => {
        if (response.status === true || response.status === 'true') {
          this.staffList = response.data;
          console.log( this.staffList);
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
           this.vendorNameList = response.data.filter((item: { expense: number; }) => item.expense === 1);
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
  gstPriceValue1(productId: any) {

    if (productId === 'MS' || productId === 'HSD') {

      this.resetPurchaseEntryForm();
      this.disablePrice = true;
      // this.productTotalValue = '0.00';

    } else {

      this.disablePrice = false;
      this.isLoading = true;
      let requestData: any = {
        api_url: 'getproductRate',
        id: productId
      }
      this.serverService.sendServerGetID(requestData).subscribe({
        next: (response: any) => {
          if (response.status === true || response.status === 'true') {
            this.productPriceValue = response.data.rate;
            this.isLoading = false;
          }
        },
        error: (error: any) => {
          console.error(error);
          this.isLoading = false;
        }
      });

    }

  }

  gstPriceValue(productId: any) {
    // For MS or HSD → reset form and disable price input
    if (productId === 'MS' || productId === 'HSD') {
      this.resetPurchaseEntryForm();
      this.disablePrice = true;
      return;
    }
    this.resetPurchaseEntryForm();

    // Otherwise → fetch price from API
    this.disablePrice = false;
    this.isLoading = true;

    const requestData = {
      api_url: 'getproductRate',
      id: productId
    };

    this.serverService.sendServerGetID(requestData).subscribe({
      next: (response: any) => {
        if (response?.status === true || response?.status === 'true') {
          // Always store as number
          this.productPriceValue = Number(response.data.rate) || 0.00;
        } else {
          this.productPriceValue = 0.00; // fallback if no rate
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error fetching product rate:', error);
        this.productPriceValue = 0.00;
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


  onTnvatChange() {
    const gst = this.gstNameList.find(g => g.id == this.selectedTnvat);
    this.tnvatRate = gst ? gst.percentage : 0;
    this.calculateTotal();
  }

  onVatLsiChange() {
    const gst = this.gstNameList.find(g => g.id == this.selectedVatLsi);
    this.vatLsiRate = gst ? gst.percentage : 0;
    this.calculateTotal();
  }

  onTcsChange() {
    const gst = this.gstNameList.find(g => g.id == this.selectedTcs);
    this.tcsRate = gst ? gst.percentage : 0;
    this.calculateTotal();
  }

  onAmountBlur(field: 'vendorAmount' | 'productPriceValue' | 'productTotalValue' | 'productLiter' | 'todayPurchase' | 'productBasePriceValue') {
    let value = parseFloat(this[field] as string || '0'); // force cast to string
    if (isNaN(value) || value < 0) value = 0;  // only prevent negative
    (this as any)[field] = value.toFixed(2);   // force 2 decimals as string
    this.calculateTotal();
  }
  calculateTotal() {
    const qty = Number(this.qty) || 0;
    const productPrice = Number(this.productPriceValue) || 0;
    const productLiter = Number(this.productLiter) || 0;

    // Base calculation
    this.productTotalValue = this.productBasePriceValue * productLiter / 1000;
    const productTotal = this.productTotalValue;

    const base = qty * productPrice; // main base value

    // VAT calculations
    if (productLiter !== 0) {
      this.tnvatAmt = (productLiter * this.tnvatRate);
      this.vatLsiAmt = ((productTotal + base) * (Number(this.vatLsiRate) || 0)) / 100;
    } else {
      this.tnvatAmt = (base * this.tnvatRate) / 100;
      this.vatLsiAmt = (base * (Number(this.vatLsiRate) || 0)) / 100;
    }

    // TCS should be on Base + VATs
    const tcsBase = base + this.tnvatAmt + this.vatLsiAmt + productTotal;
    this.tcsAmt = (tcsBase * (Number(this.tcsRate) || 0)) / 100;

    // Final totals
    const vendor = Number(this.vendorAmount) || 0.00;
    const totalVal = base + this.tnvatAmt + this.vatLsiAmt + this.tcsAmt + productTotal;

    // Keep numbers for math
    this.total = totalVal;
    this.grossTotal = this.total + vendor;

    // Per-liter purchase cost
    // this.todayPurchase = productLiter !== 0
    //   ? this.grossTotal / productLiter
    //   : 0;

    // Always format for UI
    this.total = Number(this.total.toFixed(2));
    this.grossTotal = Number(this.grossTotal.toFixed(2));
    // this.todayPurchase = Number(this.todayPurchase.toFixed(2));
    this.tnvatAmt = Number(this.tnvatAmt.toFixed(2));
    this.vatLsiAmt = Number(this.vatLsiAmt.toFixed(2));
    this.tcsAmt = Number(this.tcsAmt.toFixed(2));
    this.productTotalValue = (this.productTotalValue.toFixed(2));
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
    if (date === '' || date === null) {

      iziToast.error({
        message: 'Select the Date',
        position: 'topRight'
      });
      this.isLoading = false;
      return false;

    }
    var selectedDate = new Date(date);
    var today = new Date();

    if (selectedDate > today) {
      iziToast.error({
        message: 'Future dates are not allowed',
        position: 'topRight'
      });
      this.isLoading = false;
      return false;
    }

    const validations = [
      { value: this.selectedProduct, message: 'Select Product Name' },
      // { value: this.selectedVendor1, message: 'Select Vendor Name' },
      { value: (this.selectedVendor1 || this.selectedStaff), message: 'Select Vendor or Staff' },
      { value: this.qty, message: 'Enter Qty', isNumber: true },
      { value: this.productPriceValue, message: 'Enter Price', isNumber: true },
      // { value: this.selectedTnvat, message: 'Select TNVAT' },
      // { value: this.selectedVatLsi, message: 'Select VAT LIS' },
      // { value: this.selectedTcs, message: 'Select TCS' },
      // { value: this.selectedVendor2, message: 'Select Vendor Name' },
      // { value: this.vendorAmount, message: 'Select Amount', isNumber: true },
      // { value: this.selectedFile, message: 'Select File' }
    ];

    for (const field of validations) {
      if (
        field.value === null ||
        field.value === undefined ||
        field.value === '' ||
        (field.isNumber && Number(field.value) <= 0)
      ) {
        iziToast.error({
          message: field.message,
          position: 'topRight'
        });
        this.isLoading = false;
        return false;
      }
    }
    const accessToken = localStorage.getItem('access_token');

    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
    };
    const formData: FormData = new FormData();

    formData.append("purchase_date", date || "");
    // Product details
    formData.append("product_id", this.selectedProduct?.id || "");
    formData.append("product_name", this.selectedProduct?.name || "");
    formData.append("description", this.productDescription || "");
    // formData.append("vendor_id", this.selectedVendor1?.id || "");
    // formData.append("vendor_name", this.selectedVendor1?.vendor_name || "");
      // ✅ Vendor or Staff condition
  if (this.selectedVendor1) {
    formData.append("vendor_id", this.selectedVendor1?.id || "");
    formData.append("vendor_name", this.selectedVendor1?.vendor_name || "");
  } else if (this.selectedStaff) {
    formData.append("vendor_id", this.selectedStaff?.user_id || "");
    formData.append("vendor_name", this.selectedStaff?.full_name || "");
  }
    formData.append("qty", this.qty?.toString() || "0");
    formData.append("price", (this.productPriceValue && this.productPriceValue !== "0.00" ? this.productPriceValue : this.productTotalValue).toString());
    formData.append("total", this.total?.toString() || "0.00");
    formData.append("total_liters", this.productLiter?.toString() || "0.00");
    formData.append("base_price", this.productBasePriceValue?.toString() || "0.00");

    // GST values
    formData.append("tnvat_id", this.selectedTnvat?.toString() || "0");
    formData.append("vat_lsi_id", this.selectedVatLsi?.toString() || "0");
    formData.append("tcs_id", this.selectedTcs?.toString() || "0");
    formData.append("tnvat", this.tnvatAmt?.toString() || "0.00");
    formData.append("vat_lsi", this.vatLsiAmt?.toString() || "0.00");
    formData.append("tcs", this.tcsAmt?.toString() || "0.00");

    // Transport values
    formData.append("purchase_cost", this.total?.toString() || "0.00");
    formData.append("transport_vendor", this.selectedVendor2?.id || "");
    formData.append("transport_vendor_name", this.selectedVendor2?.vendor_name || "");
    formData.append("net_total", this.vendorAmount?.toString() || "0.00");
    formData.append("gross_total", this.grossTotal?.toString() || "0.00");
    formData.append("today_purchase", this.todayPurchase?.toString() || "0.00");

    // File (if uploaded)
    if (this.selectedFile) {
      formData.append("file", this.selectedFile, this.selectedFile.name);
    }
    // File (if uploaded)
    if (this.selectedVendorFile) {
      formData.append("vendor_file", this.selectedVendorFile, this.selectedVendorFile.name);
    }

    // Purchase Date
    // const today = new Date();
    // const formattedDate = today.toISOString().split('T')[0]; // yyyy-mm-dd
    // formData.append("purchase_date", formattedDate);

    // 🔥 Send API request
    this.http.post("https://chettinadlink.cal4care.com/api/expense-purchase-entries/expensepurchaseSave", formData, httpOptions)
      .subscribe({
        next: (response: any) => {

          if (response.status === true || response.status === 'true') {
            iziToast.success({
              message: response.message,
              position: 'topRight'
            });
            // this.resetPurchaseEntryForm();
            this.router.navigate(['/expensePurchaseEntryReport']);
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
    this.selectedStaff = '';
    this.selectedVendor1 = '';
    this.selectedVendor2 = '';
    this.selectedGst = '';
    this.selectedTnvat = '';
    this.selectedVatLsi = '';
    this.selectedTcs = '';

    // Numeric fields (always reset to number, not string)
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

