import { Component, OnInit, AfterViewInit, EventEmitter, Output, Input } from '@angular/core';
import { getSpan, getAudio } from '../../utilities/ui-utils';

@Component({
  selector: 'app-line-info',
  templateUrl: './line-info.component.html',
  styleUrls: ['./line-info.component.scss']
})
export class LineInfoComponent implements OnInit, AfterViewInit {
  receiverCtrlToggle = false;
  receiverVolume = 100;
  micLiveMeter = 100;
  receiverLiveMeter = 100;

  @Output() changeLine = new EventEmitter<number>();
  @Output() changeReceiverVolume = new EventEmitter<number>();

  @Input() micMeter: number;
  @Input() receiverMeter: number;
  @Input() selectLine: string;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const receiverSpan = getSpan(`receiver-control`);
    receiverSpan.addEventListener(`click`, () => {
      this.receiverCtrlToggle = !this.receiverCtrlToggle;
    });
  }

  onClickOutsideReceiver(e: Event): void {
    const targetClass = (e.target as Element).className;
    
    if (targetClass !== `fas fa-headset`) {
      this.receiverCtrlToggle = false;
    }
  }

  onChangeReceiverVolume(): void {
    const volume = Math.round(this.receiverVolume) / 100;
    this.changeReceiverVolume.emit(parseFloat(volume.toFixed(2)));
  }

  onChangeLine(): void {
    const lineNumber = this.selectLine === '1' ? 0:1;
    this.changeLine.emit(lineNumber);
  }
}
