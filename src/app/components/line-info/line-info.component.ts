import { Component, OnInit, AfterViewInit, EventEmitter, Output } from '@angular/core';
import { getSpan, getAudio } from '../../utilities/ui-utils';

@Component({
  selector: 'app-line-info',
  templateUrl: './line-info.component.html',
  styleUrls: ['./line-info.component.scss']
})
export class LineInfoComponent implements OnInit, AfterViewInit {
  receiverCtrlToggle = false;
  receiverVolume = 0.0;
  micLiveMeter = 100;
  receiverLiveMeter = 100;
  selectLine = `1`;

  @Output() changeLine = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const receiverSpan = getSpan(`receiver-control`);
    receiverSpan.addEventListener(`click`, () => {
      this.receiverCtrlToggle = !this.receiverCtrlToggle;
      // const remoteAudio = getAudio(`remoteAudio`);
      // if (this.endUser && this.endUser.remoteAudioTrack !== undefined) {
      //   const audioTrack = this.endUser.remoteAudioTrack;
      //   const settings = audioTrack.getSettings();
      //   const volume = settings.map(setting => setting.volume);
      //   remoteAudio.volume = volume;
      // }
      // this.receiverVolume = remoteAudio.volume * 100;
    });
  }

  onClickOutsideReceiver(e: Event): void {
    const targetClass = (e.target as Element).className;
    
    if (targetClass !== `fas fa-headset`) {
      this.receiverCtrlToggle = false;
    }
  }

  changeReceiverVolume(): void {
    const remoteAudio = getAudio(`remoteAudio`);    
    const volume = Math.round(this.receiverVolume) / 100;
    remoteAudio.volume = parseFloat(volume.toFixed(2));
  }

  onChangeLine(): void {
    this.changeLine.emit();
  }
}
