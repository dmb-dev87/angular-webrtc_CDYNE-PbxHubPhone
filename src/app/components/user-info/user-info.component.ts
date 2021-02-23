import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { PhoneUser } from 'src/app/models/phoneuser';
import { PhoneStatusService } from 'src/app/services/phonestatus.service';
import { getButtonText } from 'src/app/utilities/ui-utils';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss']
})
export class UserInfoComponent implements OnInit {
  @Output() register = new EventEmitter<string>();
  @Output() unregister = new EventEmitter();

  phoneUser: PhoneUser = undefined;
  callerId: string;
  callStatus: string;

  constructor(private phoneStatusService: PhoneStatusService) {}

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
