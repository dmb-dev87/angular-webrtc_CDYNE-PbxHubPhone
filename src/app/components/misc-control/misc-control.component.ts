import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { getButtonText } from '../../utilities/ui-utils';

@Component({
  selector: 'app-misc-control',
  templateUrl: './misc-control.component.html',
  styleUrls: ['./misc-control.component.scss']
})
export class MiscControlComponent implements OnInit {
  @Output() transferA = new EventEmitter<boolean>();
  @Output() transferB = new EventEmitter<boolean>();
  @Output() monitor = new EventEmitter();
  @Output() message = new EventEmitter();
  @Output() conference = new EventEmitter<boolean>();
  
  @Input() axferBtnDisabled: boolean;
  @Input() bxferBtnDisabled : boolean;
  @Input() transferStateA: boolean;
  @Input() transferStateB: boolean;
  @Input() monitorBtnDisabled: boolean;
  @Input() messageBtnDisabled: boolean;
  @Input() receivedMessages: number;
  @Input() confBtnDisabled: boolean;
  @Input() confState: boolean;

  constructor() {}

  ngOnInit(): void {}

  onMakeTransferA(): void {
    let completed = false;
    const btnText = getButtonText('transfer-call-a').toLowerCase();
    if (btnText === `attended x-fer`) {
      completed = false;
    }
    else if (btnText === `complete x-fer`) {
      completed = true;
    }
    this.transferA.emit(completed);   
  }

  onMakeTransferB(): void {
    let completed = false;
    const btnText = getButtonText('transfer-call-b').toLowerCase();
    if (btnText === `blind x-fer`) {
      completed = false;
    }
    else if (btnText === `complete x-fer`) {
      completed = true;
    }
    this.transferB.emit(completed);   
  }

  onDialMonitor(): void {
    this.monitor.emit();
  }

  onMessage(): void {
    this.message.emit();
  }

  onMakeConference(): void {
    let completed = false;
    const btnText = getButtonText(`conf-call`).toLowerCase();
    if (btnText === `conference`) {
      completed = false;
    }
    else if (btnText === `complete conf`) {
      completed = true;
    }
    this.conference.emit(completed);
  }
}