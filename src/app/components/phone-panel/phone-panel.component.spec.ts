import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhonePanelComponent } from './phone-panel.component';

describe('PhonePanelComponent', () => {
  let component: PhonePanelComponent;
  let fixture: ComponentFixture<PhonePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PhonePanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PhonePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
