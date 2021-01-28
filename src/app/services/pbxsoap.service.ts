import { Injectable } from '@angular/core';
import { NgxSoapService, Client, ISoapMethodResponse } from 'ngx-soap';
import { Store } from '@ngrx/store';

import * as PhoneContactsActions from './../actions/phonecontacts.actions';
import { AppState, getPhoneContactsState } from '../reducers';

@Injectable({
  providedIn: 'root'
})
export class PbxsoapService {
  soapClient: Client;
  userKey: string;
  message: string;

  constructor(private store: Store<AppState>, private soap: NgxSoapService) {
    this.userKey = localStorage.getItem(`user_name`);
    console.log(`+++++++++++++++++++++`, this.userKey);
  }

  load(): void {
    this.soap.createClient(`assets/PBXControlSimple.wsdl`)
    // this.soap.createClient(`http://orfpbx3.cdyne.com/PBXControl.svc?wsdl`)
      .then((client) => {
        this.soapClient = client;
        this.soapClient.addHttpHeader(`Access-Control-Allow-Origin`, `http://localhost:4200`);
        this.store.dispatch(new PhoneContactsActions.LoadPhoneContactsBegin());
        console.log(`+++++++++++++++++++++++++`, this.soapClient);
      });
  }

  loadData(): any {
    const body = {
      UserKey: this.userKey
    };

    console.log(`+++++++++++++++++++++++++++`, body);

    return (<any> this.soapClient).User_GetDirectory(body);

    // (<any> this.soapClient).User_GetDirectory(body)
    //   .subscribe((res: ISoapMethodResponse) => {
    //     this.message = res.result.User_GetDirectoryResponse;
    //     console.log(`+++++++++++++++++++++++++++++++ message`, this.message);
    //   });
    //
    // return this.message;
  }
}
