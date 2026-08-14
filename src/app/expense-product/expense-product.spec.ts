import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseProduct } from './expense-product';

describe('ExpenseProduct', () => {
  let component: ExpenseProduct;
  let fixture: ComponentFixture<ExpenseProduct>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseProduct]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpenseProduct);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
