import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, AbstractControl, Validators, ValidationErrors } from '@angular/forms';
import { Server } from '../server';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatTooltipModule } from '@angular/material/tooltip';
import iziToast from 'izitoast';
import Swal from 'sweetalert2';
declare var $: any;

@Component({
  selector: 'app-oil-purchase-enrty',
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, NgSelectModule, MatTooltipModule],
  templateUrl: './oil-purchase-enrty.html',
  styleUrl: './oil-purchase-enrty.css'
})
export class OilPurchaseEnrty implements OnInit {

  isLoading = false;
  errorMessage: string = '';
  limit: string = '10';
  offset: string = '0';

  selectedProduct: any = '';
  selectedVendor1: any = '';
  productNameList: any[] = [];
  vendorNameList: any[] = [];

  purchaseEntryList: any[] = [];

  // list action 
  isActionOpen: number | null = null;

  // iframe
  selectedFileUrl: SafeResourceUrl | null = null;
  isImageFile = false;
  srcDocContent: any = null;
  userRoles: number[] = [];
  selectedPurchase: any;
  selectedItems: any;
  gstNameList: any;
  disablePrice: boolean = false;
  purchase_date: any;

  constructor(private serverService: Server, private fb: FormBuilder, private http: HttpClient, private sanitizer: DomSanitizer, private router: Router) { }

  ngOnInit(): void {

    const rolesString = localStorage.getItem('roles');
    this.userRoles = rolesString ? JSON.parse(rolesString) : [];
    this.getProductName();
    this.getVendorName();
    this.getpurchaseEntryListData();
  }

  toggleActionMenu(index: number, event: MouseEvent) {
    event.stopPropagation(); // prevent triggering document click
    if (this.isActionOpen === index) {
      this.isActionOpen = null;
    } else {
      this.isActionOpen = index;
    }
  }

  closeAllActionMenus() {
    this.isActionOpen = null;
  }

  // 👇 auto-close when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.closeAllActionMenus();
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
          this.vendorNameList = response.data
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error(error);
        this.isLoading = false;
      }
    });

  }

  getpurchaseEntryListData() {

    this.isLoading = true;
    let fromDate = $('#filterFromData').val() || '';
    let toDate = $('#filterToDate').val() || '';
    let productName = this.selectedProduct?.name || "";
    let vendorName = this.selectedVendor1?.vendor_name || "";
    const user_id = localStorage.getItem('user_id');
    const requestData = {
      moduleType: 'oil-purchase-entries',
      api_type: 'api',
      api_url: 'oilpurchaseList',
      user_id: user_id,
      from_date: fromDate,
      to_date: toDate,
      product_name: productName,
      vendor_name: vendorName,
      limit: '',
      offset: this.offset
    };

    this.serverService.sendServerPurchaseEntry(requestData).subscribe({
      next: (response: any) => {
        if (response.status && response.data) {

          this.purchaseEntryList = response.data;
          this.isLoading = false;
          const table = $('#datatable').DataTable();
          table.destroy();


          setTimeout(() => {
            $('#datatable').DataTable();
          }, 0);


        }
      }
    });
  }

   home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }

  doucmentPurchaseEntry(fileUrl: string) {

    if (fileUrl === null || fileUrl === '') {

      iziToast.error({
        message: 'Data Not Found',
        position: 'topRight'
      });

      return false;
    }
    const lowerUrl = fileUrl.toLowerCase();
    this.isImageFile = lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') ||
      lowerUrl.endsWith('.png') || lowerUrl.endsWith('.gif') ||
      lowerUrl.endsWith('.webp');

    if (this.isImageFile) {
      // build HTML wrapper for iframe
      const html = `
        <html>
          <head>
            <style>
              html, body {
                margin: 0;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                background: #000;
              }
              img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            <img src="${fileUrl}">
          </body>
        </html>
      `;
      this.srcDocContent = this.sanitizer.bypassSecurityTrustHtml(html);
      this.selectedFileUrl = null;
    } else {
      this.selectedFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
      this.srcDocContent = null;
    }

    return true;
  }

  closeViewer() {
    this.selectedFileUrl = null;
    this.srcDocContent = null;
    this.isImageFile = false;
  }



  addPurchaseEntryModal() {

    this.router.navigate(['/addPurchaseEntry']);
  }
  editPurchaseEntryModal(purchaseEntryID: any) {

    this.router.navigate(['/editPurchaseEntryEdit'], {
      queryParams: { purchaseEntryID }
    });
  }

  deletePurchaseEntry(id: any) {

    const requestData = {
      api_url: 'oilpurchaseDelete',
      moduleType: 'oil-purchase-entries',
      id: id
    };

    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete. This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Deleting...', allowOutsideClick: false });
        Swal.showLoading();
        this.serverService.sendServerPurchaseEntryGET(requestData).subscribe({
          next: (res: any) => {
            Swal.close();
            Swal.fire('Deleted!', 'The entry has been deleted.', 'success');
            this.getpurchaseEntryListData();
          },
          error: (err: any) => {
            Swal.close();
            Swal.fire('Error', 'Failed to delete the entry.', 'error');
          }
        });
      }
    });
  }

  getTaxName(id: number): string {
    if (!id || !this.gstNameList) return '';
    const taxItem = this.gstNameList.find((t: any) => t.id === id);
    return taxItem ? `${taxItem.tax} (${taxItem.percentage}%)` : '';
  }

  viewPurchaseEntry(purchaseId: any) {

    this.isLoading = true;
    let requestData: any = {
      moduleType: 'oil-purchase-entries',
      api_url: 'oilpurchaseEdit',
      id: purchaseId
    }
    this.serverService.sendServerPurchaseEntryGET(requestData).subscribe({
      next: (response: any) => {
        if (response.status === true || response.status === 'true') {
          this.gstDropDown();
          this.selectedPurchase = response.data;
          this.purchase_date = this.selectedPurchase.purchase_date;
          this.selectedItems = response.data.items || [];
          if (this.selectedPurchase.product_id === 'MS' || this.selectedPurchase.product_id === 'HSD') {

            this.disablePrice = true;

          } else {
            this.disablePrice = false;
          }

          $('#viewModal').modal('show');
          this.isLoading = false;

        }
      },
      error: (error: any) => {
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  closeModal() {

    $('#viewModal').modal('hide')
  }


}
