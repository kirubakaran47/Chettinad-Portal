import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpensePurchaseEntryEdit } from './expense-purchase-entry-edit';

describe('ExpensePurchaseEntryEdit', () => {
  let component: ExpensePurchaseEntryEdit;
  let fixture: ComponentFixture<ExpensePurchaseEntryEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensePurchaseEntryEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpensePurchaseEntryEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
