import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-phone-control',
  templateUrl: './phone-control.component.html',
  styleUrls: ['./phone-control.component.scss']
})
export class PhoneControlComponent implements OnInit {
  holdToggle = false;
  muteToggle = false;

  @Input() dndStatus: boolean;

  @Output() hold = new EventEmitter<boolean>();
  @Output() mute = new EventEmitter<boolean>();
  @Output() dnd = new EventEmitter();
  @Output() hangupCall = new EventEmitter();
  @Output() makeCall = new EventEmitter();
  @Output() changeNumber = new EventEmitter<string>();
  
  constructor() { }

  ngOnInit(): void {
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
    this.dnd.emit();
  }

  onHangupCall(): void {
    this.hangupCall.emit();
  }

  onMakeCall(): void {
    this.makeCall.emit();
  }

  onChangeNumber(value: string): void {
    this.changeNumber.emit(value);
  }
}
