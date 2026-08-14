import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerManage } from './customer-manage';

describe('CustomerManage', () => {
  let component: CustomerManage;
  let fixture: ComponentFixture<CustomerManage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerManage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerManage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
