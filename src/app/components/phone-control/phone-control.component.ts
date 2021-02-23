import { Component, OnInit, AfterViewInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-phone-control',
  templateUrl: './phone-control.component.html',
  styleUrls: ['./phone-control.component.scss']
})
export class PhoneControlComponent implements OnInit, AfterViewInit {
  holdToggle = false;

  @Output() holdEvent = new EventEmitter<boolean>();
  
  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    
  }

  onHold(value: boolean): void {
    this.holdEvent.emit(value);
  }
}
