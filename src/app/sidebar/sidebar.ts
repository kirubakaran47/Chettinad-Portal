import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {
  activeMenu: string = '';
  activeSubMenu: string = '';
  userRoles: number[] = [];
  isCollapsed = false;
  currentUrl = '';
  constructor(private router: Router, private cd: ChangeDetectorRef) {
      this.router.events.subscribe(() => {
    this.currentUrl = this.router.url;
  });
   }


  ngOnInit(): void {
    const rolesString = localStorage.getItem('roles');
    this.userRoles = rolesString ? JSON.parse(rolesString) : [];

    // Set active menu on load
    this.setActiveMenu(this.router.url);

    // Update on every route change
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.setActiveMenu(event.urlAfterRedirects);
      }
    });
  }
  isCustomerManageActive(): boolean {
  return (
    this.currentUrl.startsWith('/customerManage') ||
    this.currentUrl.startsWith('/addCustomer')
  );
}
  setActiveMenu(url: string): void {
    if (url.startsWith('/invoice') || url.startsWith('/AddInvoice') || url.startsWith('/EditInvoice') || url.startsWith('/ConvertInvoice') ) {
      this.activeMenu = 'invoice';
    } else if (url.startsWith('/AddQuotation') || url.startsWith('/EditQuotation')) {
      this.activeMenu = 'quotation';
    } else if (url.startsWith('/addUser') || url.startsWith('/userDetails')) {
      this.activeMenu = 'manage';
    } else if (url.startsWith('/ShiftReprort') || url.startsWith('/PurchaseReprort') || url.startsWith('/ProfitLoss')) {
      this.activeMenu = 'report';
    } else if (url.startsWith('/CustomerCreditManage') || url.startsWith('/CustomerCreditPaymentreport') || url.startsWith('/CustomerCreditSales')) {
      this.activeMenu = 'customermanage';
    } else if (url.startsWith('/purchaseEntryReport') || url.startsWith('/addPurchaseEntry') || url.startsWith('/editPurchaseEntryEdit') || url.startsWith('/expensePurchaseEntryReport') || url.startsWith('/expensePurchaseEntryAdd') || url.startsWith('/expensePurchaseEntryEdit')) {
      this.activeMenu = 'purchaseEntry';
    } else if (url.startsWith('/productMaster') || url.startsWith('/vendorList') || url.startsWith('/customerManage') || url.startsWith('/addCustomer')|| url.startsWith('/rpsDetails') || url.startsWith('/addVendor') || url.startsWith('/taxDetails')|| url.startsWith('/expenseProduct')) {
      this.activeMenu = 'productMaster';
      if (url.startsWith('/vendorList') || url.startsWith('/addVendor')) {
        this.activeSubMenu = 'vendor';
      } else {
        this.activeSubMenu = '';
      }
    } else if (url.startsWith('/settings')) {
      this.activeMenu = 'settings';
    } else {
      this.activeMenu = '';
      this.activeSubMenu = '';
    }
  }

   toggleMenu(menu: string): void {
  this.activeMenu = this.activeMenu === menu ? '' : menu;
  this.activeSubMenu = ''; 
}

  toggleSubMenu(subMenu: string): void {
    this.activeSubMenu = this.activeSubMenu === subMenu ? '' : subMenu;
  }


  // toggleMenu(menu: string): void {
  //   this.activeMenu = this.activeMenu === menu ? '' : menu;
  // }
  toggleMobileMenu(): void {
    document.body.classList.toggle('mobile-menu-open');
  }
  toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
  }
}
