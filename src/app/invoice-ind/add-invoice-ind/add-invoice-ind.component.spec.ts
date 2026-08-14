import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddInvoiceIndComponent } from './add-invoice-ind.component';

describe('AddInvoiceIndComponent', () => {
  let component: AddInvoiceIndComponent;
  let fixture: ComponentFixture<AddInvoiceIndComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddInvoiceIndComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddInvoiceIndComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
