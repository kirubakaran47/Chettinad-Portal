import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditInvoiceIndComponent } from './edit-invoice-ind.component';

describe('EditInvoiceIndComponent', () => {
  let component: EditInvoiceIndComponent;
  let fixture: ComponentFixture<EditInvoiceIndComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditInvoiceIndComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditInvoiceIndComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
