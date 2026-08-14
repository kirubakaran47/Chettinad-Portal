import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditQuatationindComponent } from './edit-quatationind.component';

describe('EditQuatationindComponent', () => {
  let component: EditQuatationindComponent;
  let fixture: ComponentFixture<EditQuatationindComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditQuatationindComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditQuatationindComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
