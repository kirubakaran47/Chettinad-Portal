import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpensePurchaseEntry } from './expense-purchase-entry';

describe('ExpensePurchaseEntry', () => {
  let component: ExpensePurchaseEntry;
  let fixture: ComponentFixture<ExpensePurchaseEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensePurchaseEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpensePurchaseEntry);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
