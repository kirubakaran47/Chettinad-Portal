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
@Component({
  selector: 'app-expense-purchase-entry-edit',
  imports: [CommonModule, FormsModule, NgSelectModule,ReactiveFormsModule],
  templateUrl: './expense-purchase-entry-edit.html',
  styleUrl: './expense-purchase-entry-edit.css'
})
export class ExpensePurchaseEntryEdit implements OnInit {

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
  staffTaxDisable: boolean = false;
  productDescription: any;
  purchase_date: any;
  
  vendorForm!: FormGroup;
  customer_code: any;
  errorMessage: string = '';
  staffList: any[] = [];
  selectedStaff: any = '';

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
       gas: [''],
      oil: [''],
      expense: [''],
      transport: [''],
    });
    this.getStaffs();
    this.getProductName();
    this.getVendorName();
    this.gstDropDown();
    this.editPurchaseEntry();



  }

  // onGstChange() {
  //   if (this.selectedProduct.name == 'Staff allowance') {
  //     this.selectedTnvat = '0';
  //     this.selectedVatLsi = '0';
  //     this.selectedTcs = '0';

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

      this.disablePrice = true;
      this.productTotalValue = '0.00';

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

  // calculateTotal() {
  //   const qty = Number(this.qty) || 0;
  //   const productPrice = Number(this.productPriceValue) || 0;
  //   const productLiter = Number(this.productLiter) || 0;
  //   this.productTotalValue = ((this.productBasePriceValue * productLiter).toFixed(2)) || 0.00;
  //   const productTotal = Number(this.productTotalValue) || 0.00;
  //   // Base = qty*price + already stored product total
  //   const base = Number (((qty * productPrice) + productTotal).toFixed(2));

  //   // Reset tax amounts
  //   this.tnvatAmt = 0;
  //   this.vatLsiAmt = 0;
  //   this.tcsAmt = 0;

  //   // TNVAT
  //   if (this.selectedTnvat) {

  //     const tnvatObj = this.gstNameList.find(g => g.id === this.selectedTnvat);
  //     if (tnvatObj) {
  //       this.tnvatRate = tnvatObj.percentage;
  //       if (productLiter !== 0) {
  //         this.tnvatAmt = Number((productLiter * this.tnvatRate).toFixed(2));
  //       } else {
  //         this.tnvatAmt = Number(((base * this.tnvatRate) / 100).toFixed(2));
  //       }
  //     }
  //   }

  //   // VAT LSI
  //   if (this.selectedVatLsi) {
  //     const vatLsiObj = this.gstNameList.find(g => g.id === this.selectedVatLsi);
  //     if (vatLsiObj) {
  //       this.vatLsiRate = vatLsiObj.percentage;
  //       this.vatLsiAmt = (base * this.vatLsiRate) / 100;
  //     }
  //   }

  //   // TCS
  //   if (this.selectedTcs) {
  //     const tcsObj = this.gstNameList.find(g => g.id === this.selectedTcs);
  //     if (tcsObj) {
  //       this.tcsRate = tcsObj.percentage;
  //       // this.tcsAmt = (base * this.tcsRate) / 100;

  //       if (productLiter !== 0) {
  //         this.tcsAmt = Number((( this.tnvatAmt + this.vatLsiAmt + base) * (Number(this.tcsRate) || 0) / 100).toFixed(2));
  //       } else {
  //         this.tcsAmt = Number(((base * this.tcsRate) / 100).toFixed(2));
  //       }
  //     }
  //   }

  //   const transport = parseFloat(this.transportAmount || '0');
  //   const vendor = parseFloat(this.vendorAmount || '0');

  //   // Totals
  //   this.total = parseFloat((base + this.tnvatAmt + this.vatLsiAmt + this.tcsAmt).toFixed(2));
  //   this.grossTotal = parseFloat((this.total + transport + vendor).toFixed(2));
  //   this.todayPurchase = Number((this.grossTotal / productLiter).toFixed(2))
  // }

  calculateTotal() {
    const qty = Number(this.qty) || 0;
    const productPrice = Number(this.productPriceValue) || 0;
    const productLiter = Number(this.productLiter) || 0;

    // Base product value
    this.productTotalValue = (this.productBasePriceValue * productLiter / 1000).toFixed(2);
    const productTotal = Number(this.productTotalValue) || 0.00;

    // Base = qty*price + product total
    const base = Number(((qty * productPrice) + productTotal).toFixed(2));

    // Reset tax amounts
    this.tnvatAmt = 0;
    this.vatLsiAmt = 0;
    this.tcsAmt = 0;

    // TNVAT
    if (this.selectedTnvat) {
      const tnvatObj = this.gstNameList.find(g => g.id == this.selectedTnvat);

      if (tnvatObj) {
        this.tnvatRate = tnvatObj.percentage;

        if (productLiter !== 0) {
          this.tnvatAmt = Number((productLiter * this.tnvatRate).toFixed(2));
        } else {
          this.tnvatAmt = Number(((base * this.tnvatRate) / 100).toFixed(2));
        }
      }
    }

    // VAT LSI
    if (this.selectedVatLsi) {

      const vatLsiObj = this.gstNameList.find(g => g.id == this.selectedVatLsi);
      if (vatLsiObj) {

        this.vatLsiRate = vatLsiObj.percentage;

        if (productLiter != 0.00) {
          this.vatLsiAmt = Number(((productTotal) * this.vatLsiRate / 100).toFixed(2));
        } else {
          this.vatLsiAmt = Number(((base * this.vatLsiRate) / 100).toFixed(2));
        }
      }
    }

    // TCS
    if (this.selectedTcs) {
      const tcsObj = this.gstNameList.find(g => g.id == this.selectedTcs);
      if (tcsObj) {
        this.tcsRate = tcsObj.percentage;
        if (productLiter !== 0.00) {
          this.tcsAmt = Number(((this.tnvatAmt + this.vatLsiAmt + base) * (this.tcsRate || 0) / 100).toFixed(2));
        } else {
          this.tcsAmt = Number(((base * this.tcsRate) / 100).toFixed(2));
        }
      }
    }

    // Transport & vendor
    const transport = Number(this.transportAmount) || 0;
    const vendor = Number(this.vendorAmount) || 0;

    // Totals
    this.total = Number((base + this.tnvatAmt + this.vatLsiAmt + this.tcsAmt).toFixed(2));
    this.grossTotal = Number((this.total + transport + vendor).toFixed(2));
    // this.todayPurchase = productLiter !== 0
    //   ? Number((this.grossTotal / productLiter).toFixed(2))
    //   : 0;
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

  editPurchaseEntry() {

    this.isLoading = true;
    let requestData: any = {
      moduleType: 'expense-purchase-entries',
      api_url: 'expensepurchaseEdit',
      id: this.purchaseEntryID
    }
    this.serverService.sendServerPurchaseEntryGET(requestData).subscribe({
      next: (response: any) => {
        if (response.status === true || response.status === 'true') {
          const data = response.data;

          this.purchase_date = data.purchase_date;
          this.productDescription = data.description;
          this.selectedProduct = { id: data.product_id, name: data.product_name };
          this.selectedVendor1 = { id: data.vendor_id, vendor_name: data.vendor_name };
            if (data.vendor_id && data.vendor_name) {
          this.selectedStaff = { user_id: data.vendor_id, full_name: data.vendor_name };
        } else {
          this.selectedStaff = null; 
        }
          this.qty = +data.qty;

          // if (data.product_id === 'MS' || data.product_id === 'HSD') {
          //   // this.productTotalValue = +data.price;
          //   this.productTotalValue = Number(data.price).toFixed(2)
          //   this.disablePrice = true;
          // }
          // else {
          //   this.productPriceValue = +data.price;
          //   this.disablePrice = false;
          // }
          console.log('data.product_id', data.product_name);

          if (data.product_name === 'Staff allowance'|| data.product_name === 'Salary') {
            this.productPriceValue = +data.price;
            this.staffTaxDisable = true;
          }
          else {
            this.productPriceValue = +data.price;
            this.staffTaxDisable = false;
          }



          this.selectedTnvat = +data.tnvat_id;
          this.selectedVatLsi = +data.vat_lsi_id;
          this.selectedTcs = +data.tcs_id;
          this.tnvatAmt = +data.tnvat;
          this.vatLsiAmt = +data.vat_lsi;
          this.tcsAmt = +data.tcs;
          this.total = +data.total;
          this.productLiter = Number(data.total_liters).toFixed(2);
          this.productBasePriceValue = Number(data.base_price).toFixed(2);
          // second vendor/transport section
          this.transportAmount = +data.transport_charge;
          this.selectedVendor2 = { id: data.transport_vendor, vendor_name: data.transport_vendor_name };

          // this.vendorAmount = +data.net_total;
          this.vendorAmount = Number(data.net_total).toFixed(2);
          this.grossTotal = +data.gross_total;
          this.todayPurchase = +data.today_purchase;

          // file preview
          this.fileUrl = data.file_url;   // existing file preview
          this.selectedFile = null;
          // file preview
          this.vendorFileUrl = data.vendor_file_url;   // existing file preview
          this.selectedVendorFile = null;

          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error(error);
        this.isLoading = false;
      }
    });

  }

  UpdatePurchaseEntry() {


    this.isLoading = true;

    if (this.purchase_date === '' || this.purchase_date === null) {

      iziToast.error({
        message: 'Select the Date',
        position: 'topRight'
      });
      this.isLoading = false;
      return false;
    }
    var selectedDate = new Date(this.purchase_date);
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
      // { value: this.transportAmount, message: 'Select Transport', isNumber: true },
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

    // Product details
    formData.append("purchase_date", this.purchase_date || "");
    formData.append("product_id", this.selectedProduct?.id || "");
    formData.append("product_name", this.selectedProduct?.name || "");
    formData.append("description", this.productDescription || "");
    // formData.append("vendor_id", this.selectedVendor1?.id || "");
    // formData.append("vendor_name", this.selectedVendor1?.vendor_name || "");

  // ✅ Vendor or Staff condition
if (this.selectedProduct?.name === 'Salary' || this.selectedProduct?.name === 'Staff allowance') {
  // If the product is "Salary" or "Staff allowance", use selectedStaff
  if (this.selectedStaff) {
    formData.append("vendor_id", this.selectedStaff?.user_id || "");
    formData.append("vendor_name", this.selectedStaff?.full_name || "");
  }
} else {
  // For other products, use selectedVendor1 (for example, for product_id 14)
  if (this.selectedVendor1) {
    formData.append("vendor_id", this.selectedVendor1?.id || "");
    formData.append("vendor_name", this.selectedVendor1?.vendor_name || "");
  }
}
    formData.append("qty", this.qty?.toString() || "0");
    // formData.append("price", this.productPriceValue?.toString() || "0");

    formData.append("price", (this.productPriceValue && this.productPriceValue !== 0 ? this.productPriceValue : this.productTotalValue).toString());
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
    formData.append("transport_charge", this.transportAmount?.toString() || "0.00");
    formData.append("transport_vendor", this.selectedVendor2?.id || "");
    formData.append("transport_vendor_name", this.selectedVendor2?.vendor_name || "");
    formData.append("net_total", this.vendorAmount?.toString() || "0.00");
    formData.append("gross_total", this.grossTotal?.toString() || "0.00");
    formData.append("today_purchase", this.todayPurchase?.toString() || "0.00");
    formData.append("purchase_id", this.purchaseEntryID || "");

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

    this.http.post("https://chettinadlink.cal4care.com/api/expense-purchase-entries/expensepurchaseUpdate", formData, httpOptions)
      .subscribe({
        next: (response: any) => {

          if (response.status === true || response.status === 'true') {
            iziToast.success({
              message: response.message,
              position: 'topRight'
            });
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

  onCancel() {
    this.location.back()

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

