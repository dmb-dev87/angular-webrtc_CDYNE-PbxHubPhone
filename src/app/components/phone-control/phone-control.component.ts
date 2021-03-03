import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-phone-control',
  templateUrl: './phone-control.component.html',
  styleUrls: ['./phone-control.component.scss']
})
export class PhoneControlComponent implements OnInit {
  @Output() hold = new EventEmitter<boolean>();
  @Output() mute = new EventEmitter<boolean>();
  @Output() dnd = new EventEmitter();
  @Output() hangupCall = new EventEmitter();
  @Output() makeCall = new EventEmitter();
  @Output() changeNumber = new EventEmitter<string>();

  @Input() dndStatus: boolean;
  @Input() holdBtnDisabled: boolean;
  @Input() muteBtnDisabled: boolean;
  @Input() dndBtnDisabled: boolean;
  @Input() beginBtnDisabled: boolean;
  @Input() endBtnDisabled: boolean;
  @Input() holdToggle: boolean;
  @Input() muteToggle: boolean;
  
  constructor() { }

  ngOnInit(): void {
  }

  onHold(): void {
    // this.holdToggle = !this.holdToggle;
    this.hold.emit(!this.holdToggle);
  }

  onMute(): void {
    // this.muteToggle = !this.muteToggle;
    this.mute.emit(!this.muteToggle);
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
