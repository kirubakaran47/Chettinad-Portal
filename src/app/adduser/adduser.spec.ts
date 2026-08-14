import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Adduser } from './adduser';

describe('Adduser', () => {
  let component: Adduser;
  let fixture: ComponentFixture<Adduser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Adduser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Adduser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
