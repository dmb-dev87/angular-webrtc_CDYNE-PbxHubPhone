import { Component, OnInit, AfterViewInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-phone-control',
  templateUrl: './phone-control.component.html',
  styleUrls: ['./phone-control.component.scss']
})
export class PhoneControlComponent implements OnInit {
  holdToggle = false;
  muteToggle = false;
  dndToggle = false;

  @Output() hold = new EventEmitter<boolean>();
  @Output() mute = new EventEmitter<boolean>();
  @Output() dnd = new EventEmitter();
  @Output() hangupCall = new EventEmitter();
  @Output() makeCall = new EventEmitter();
  
  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    
  }

  onHold(): void {
    this.holdToggle = !this.holdToggle;
    this.hold.emit(this.holdToggle);
  }

  onMute(): void {
    this.muteToggle = !this.muteToggle;
    this.mute.emit(this.muteToggle);
  }

  onDnd(): void {
    this.dndToggle = !this.dndToggle;
    this.dnd.emit();
  }

  onHangupCall(): void {
    this.hangupCall.emit();
  }

  onMakeCall(): void {
    this.makeCall.emit();
  }
}
