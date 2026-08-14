import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OilPurchaseEntryAdd } from './oil-purchase-entry-add';

describe('OilPurchaseEntryAdd', () => {
  let component: OilPurchaseEntryAdd;
  let fixture: ComponentFixture<OilPurchaseEntryAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OilPurchaseEntryAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OilPurchaseEntryAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
