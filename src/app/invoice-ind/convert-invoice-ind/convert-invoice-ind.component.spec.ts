import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConvertInvoiceIndComponent } from './convert-invoice-ind.component';

describe('ConvertInvoiceIndComponent', () => {
  let component: ConvertInvoiceIndComponent;
  let fixture: ComponentFixture<ConvertInvoiceIndComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConvertInvoiceIndComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConvertInvoiceIndComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
