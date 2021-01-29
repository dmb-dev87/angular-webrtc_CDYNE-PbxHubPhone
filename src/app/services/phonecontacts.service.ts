import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Store } from '@ngrx/store';

import * as PhoneContactsActions from './../actions/phonecontacts.actions';
import { AppState, getPhoneContactsState } from '../reducers';

@Injectable({
  providedIn: 'root'
})
export class PhonecontactsService {
  userKey: string;
  message: string;
  baseURL = `http://orfpbx3.cdyne.com/pbxcontrol.svc/REST`;

  constructor(private store: Store<AppState>, private http: HttpClient) {
    this.userKey = localStorage.getItem(`user_name`);
  }

  load(): void {
    this.store.dispatch(new PhoneContactsActions.LoadPhoneContactsBegin());
  }

  userGetDirecotry(): any {
    const soapAction = `"http://tempuri.org/IPBXControl/User_GetDirectory"`;

    const body = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><User_GetDirectory xmlns="http://tempuri.org/"><UserKey>${this.userKey}</UserKey></User_GetDirectory></s:Body></s:Envelope>`;

      return this.http.post(this.baseURL, body,
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'text/xml; charset=utf-8')
          .append('Accept', '*/*')
          .append('Access-Control-Allow-Methods', 'GET,POST')
          .append('Access-Control-Allow-Origin', '*')
          // .append('Access-Control-Allow-Headers',
            // 'Access-Control-Allow-Headers, Access-Control-Allow-Origin, Access-Control-Request-Method')
          .append('Content-Encoding', 'gzip, deflate, br')
          .append('SOAPAction', soapAction),
        responseType: 'text'
      });

    // return this.http.get(`/assets/fake-db/phonecontacts.xml`,
    //   {
    //     headers: new HttpHeaders()
    //       .set('Content-Type', 'text/xml')
    //       .append('Access-Control-Allow-Methods', 'GET')
    //       .append('Access-Control-Allow-Origin', '*')
    //       .append('Access-Control-Allow-Headers',
    //         'Access-Control-Allow-Headers, Access-Control-Allow-Origin, Access-Control-Request-Method')
    //       .append('Content-Type', 'text/xml; charset=utf-8'),
    //     responseType: 'text'
    //   });
  }

  getPhoneContacts(): any {
    return this.store.select(getPhoneContactsState);
  }
}
