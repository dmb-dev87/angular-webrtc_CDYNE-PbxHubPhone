import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { getButtonText } from 'src/app/utilities/ui-utils';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss']
})
export class UserInfoComponent implements OnInit {
  @Output() register = new EventEmitter<string>();
  @Output() unregister = new EventEmitter();

  @Input() callerId: string;
  @Input() callStatus: string;
  @Input() registerStatus: boolean;

  constructor() {}

  ngOnInit(): void {

  }

  onRegister(email: string): void {    
    if (email === ``) {
      return;
    }

    let btnText = getButtonText(`register-btn`).toLowerCase();

    if (btnText === `register`) {
      this.register.emit(email);
    }
    else if (btnText === `unregister`) {
      this.unregister.emit();
    }
  }
}
