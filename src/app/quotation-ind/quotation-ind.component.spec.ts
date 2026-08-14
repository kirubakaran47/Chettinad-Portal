import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuotationIndComponent } from './quotation-ind.component';

describe('QuotationIndComponent', () => {
  let component: QuotationIndComponent;
  let fixture: ComponentFixture<QuotationIndComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuotationIndComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuotationIndComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
