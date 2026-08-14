import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpensePurchaseEntryAdd } from './expense-purchase-entry-add';

describe('ExpensePurchaseEntryAdd', () => {
  let component: ExpensePurchaseEntryAdd;
  let fixture: ComponentFixture<ExpensePurchaseEntryAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensePurchaseEntryAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpensePurchaseEntryAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
