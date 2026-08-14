import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OilPurchaseEntryEdit } from './oil-purchase-entry-edit';

describe('OilPurchaseEntryEdit', () => {
  let component: OilPurchaseEntryEdit;
  let fixture: ComponentFixture<OilPurchaseEntryEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OilPurchaseEntryEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OilPurchaseEntryEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
