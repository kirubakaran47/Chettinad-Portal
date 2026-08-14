import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddQuatationindComponent } from './add-quatationind.component';

describe('AddQuatationindComponent', () => {
  let component: AddQuatationindComponent;
  let fixture: ComponentFixture<AddQuatationindComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddQuatationindComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddQuatationindComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
