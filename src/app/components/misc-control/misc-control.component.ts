import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { getButtonText, setButtonText } from '../../utilities/ui-utils';

@Component({
  selector: 'app-misc-control',
  templateUrl: './misc-control.component.html',
  styleUrls: ['./misc-control.component.scss']
})
export class MiscControlComponent implements OnInit {

  @Output() transfer = new EventEmitter<boolean>();
  
  @Input() transferState: boolean;

  constructor() { }

  ngOnInit(): void {
  }

  onMakeTransfer(): void {
    let completed = false;
    const btnText = getButtonText('transfer-call').toLowerCase();
    if (btnText === `x-fer`) {
      setButtonText(`transfer-call`, `Complete X-fer`);
      completed = false;
    }
    else if (btnText === `complete x-fer`) {
      setButtonText(`transfer-call`, 'X-fer');
      completed = true;
    }
    this.transfer.emit(completed);   
  }
}
