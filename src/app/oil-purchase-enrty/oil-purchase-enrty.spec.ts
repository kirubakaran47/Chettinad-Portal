import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OilPurchaseEnrty } from './oil-purchase-enrty';

describe('OilPurchaseEnrty', () => {
  let component: OilPurchaseEnrty;
  let fixture: ComponentFixture<OilPurchaseEnrty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OilPurchaseEnrty]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OilPurchaseEnrty);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
