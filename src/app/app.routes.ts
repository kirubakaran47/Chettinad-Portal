
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Vendor } from './vendor/vendor';
import { AddVendor } from './add-vendor/add-vendor';
import { ProductMaster } from './product-master/product-master';
import { Adduser } from './adduser/adduser';
import { UserDetsils } from './user-detsils/user-detsils';
import { Setting } from './setting/setting';

import { Login } from './login/login';
import { Tax } from './tax/tax';

import { Testing } from './testing/testing';
import { OilPurchaseEntryAdd } from './oil-purchase-enrty/oil-purchase-entry-add/oil-purchase-entry-add';
import { OilPurchaseEntryEdit } from './oil-purchase-enrty/oil-purchase-entry-edit/oil-purchase-entry-edit';
import { OilPurchaseEnrty } from './oil-purchase-enrty/oil-purchase-enrty';
import { ExpensePurchaseEntry } from './expense-purchase-entry/expense-purchase-entry';
import { ExpensePurchaseEntryAdd } from './expense-purchase-entry/expense-purchase-entry-add/expense-purchase-entry-add';
import { ExpensePurchaseEntryEdit } from './expense-purchase-entry/expense-purchase-entry-edit/expense-purchase-entry-edit';
import { ExpenseProduct } from './expense-product/expense-product';

import { InvoiceIndComponent } from './invoice-ind/invoice-ind.component';
import { AddInvoiceIndComponent } from './invoice-ind/add-invoice-ind/add-invoice-ind.component';
import { EditInvoiceIndComponent } from './invoice-ind/edit-invoice-ind/edit-invoice-ind.component';
import { ConvertInvoiceIndComponent } from './invoice-ind/convert-invoice-ind/convert-invoice-ind.component';
import { QuotationIndComponent } from './quotation-ind/quotation-ind.component';
import { AddQuatationindComponent } from './quotation-ind/add-quatationind/add-quatationind.component';
import { EditQuatationindComponent } from './quotation-ind/edit-quatationind/edit-quatationind.component';
import { Customer } from './customer/customer';
import { AddCustomer } from './customer/add-customer/add-customer'; 
import { EditCustomer } from './customer/edit-customer/edit-customer';
import { Stock } from './stock/stock';
export const routes: Routes = [
  { path: 'dashboard', component: Dashboard },
  { path: '', component: Dashboard },
  { path: 'addUser', component: Adduser },
  { path: 'userDetails', component: UserDetsils },
  { path: 'vendorList', component: Vendor },
  { path: 'addVendor', component: AddVendor },
  { path: 'productMaster', component: ProductMaster },

  { path: 'purchaseEntryReport', component: OilPurchaseEnrty },
  { path: 'addPurchaseEntry', component: OilPurchaseEntryAdd },
  { path: 'editPurchaseEntryEdit', component: OilPurchaseEntryEdit },


  { path: 'expensePurchaseEntryReport', component: ExpensePurchaseEntry },
  { path: 'expensePurchaseEntryAdd', component: ExpensePurchaseEntryAdd },
  { path: 'expensePurchaseEntryEdit', component: ExpensePurchaseEntryEdit },
  { path: 'stock', component: Stock },
  { path: 'invoice', component: InvoiceIndComponent },
  { path: 'AddInvoice', component: AddInvoiceIndComponent },
  { path: 'EditInvoice/:id', component: EditInvoiceIndComponent },
  { path: 'ConvertInvoice/:id', component: ConvertInvoiceIndComponent },

  { path: 'Quotation', component: QuotationIndComponent },
  { path: 'AddQuotation', component: AddQuatationindComponent },
  { path: 'EditQuotation/:id', component: EditQuatationindComponent },

  { path: 'customerManage', component: Customer },
  { path: 'addCustomer', component:AddCustomer},
  { path: 'editCustomer/:id', component:EditCustomer},

  { path: 'testing', component: Testing },
  { path: 'settings', component: Setting },
  { path: 'taxDetails', component: Tax },
  { path: 'expenseProduct', component: ExpenseProduct },
  { path: 'login', component: Login },
  { path: '', redirectTo: 'login', pathMatch: 'full' }, 
  { path: '**', redirectTo: 'login' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes,{ useHash: true })],
  exports: [RouterModule]
})

export class AppRoutingModule { } 