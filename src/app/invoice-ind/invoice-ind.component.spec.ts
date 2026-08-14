import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceIndComponent } from './invoice-ind.component';

describe('InvoiceIndComponent', () => {
  let component: InvoiceIndComponent;
  let fixture: ComponentFixture<InvoiceIndComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvoiceIndComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceIndComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
