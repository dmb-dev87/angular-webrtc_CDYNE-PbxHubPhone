import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PhoneContact } from 'src/app/models/phonecontact';

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
  @Output() clickNumber = new EventEmitter<string>();

  @Input() dndStatus: boolean;
  @Input() holdBtnDisabled: boolean;
  @Input() muteBtnDisabled: boolean;
  @Input() dndBtnDisabled: boolean;
  @Input() beginBtnDisabled: boolean;
  @Input() endBtnDisabled: boolean;
  @Input() holdToggle: boolean;
  @Input() muteToggle: boolean;
  @Input() phoneContacts: Array<PhoneContact>;
  
  constructor() {}

  ngOnInit(): void {}

  onHold(): void {
    this.hold.emit(!this.holdToggle);
  }

  onMute(): void {
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

  onClickNumber(toneNum: string): void {
    this.clickNumber.emit(toneNum);
  }
}