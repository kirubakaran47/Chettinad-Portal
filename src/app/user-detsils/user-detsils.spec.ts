import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDetsils } from './user-detsils';

describe('UserDetsils', () => {
  let component: UserDetsils;
  let fixture: ComponentFixture<UserDetsils>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDetsils]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserDetsils);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
