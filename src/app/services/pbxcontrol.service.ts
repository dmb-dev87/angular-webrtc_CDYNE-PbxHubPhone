import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Store } from '@ngrx/store';

import * as PhoneContactsActions from '../actions/phonecontacts.actions';
import { AppState, getPhoneContactsState } from '../reducers';

export enum DndState {
  Enabled = `DND Enabled`,
  Disabled = `DND Disabled`,
  NotAllowed = `DND Not Allowed`
}

const baseURL = `https://orfpbx3.cdyne.net/pbxcontrol.svc/REST`;

@Injectable({
  providedIn: 'root'
})
export class PbxControlService {
  user_id: string;
  user_name: string;
  message: string;  

  constructor(private store: Store<AppState>, private http: HttpClient) {
    
  }

  load(): void {
    this.user_id = localStorage.getItem(`user_id`);
    this.user_name = localStorage.getItem(`user_name`);
    this.store.dispatch(new PhoneContactsActions.LoadPhoneContactsBegin());
  }

  webRtcDemo(email: string): any {
    const soapAction = `"http://tempuri.org/IPBXControl/WebRtcDemo"`;

    const body = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><WebRtcDemo xmlns="http://tempuri.org/"><Email>${email}</Email></WebRtcDemo></s:Body></s:Envelope>`

    return this.http.post(baseURL, body, {
      headers: new HttpHeaders()
        .set('Content-Type', 'text/xml; charset=utf-8')
        .append('Accept', '*/*')
        .append('Access-Control-Allow-Methods', 'GET,POST')
        .append('Access-Control-Allow-Origin', '*')
        .append('Content-Encoding', 'gzip, deflate, br')
        .append('SOAPAction', soapAction),
      responseType: 'text'
    });
  }

  userGetDirecotry(): any {
    const soapAction = `"http://tempuri.org/IPBXControl/User_GetDirectory"`;

    const body = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><User_GetDirectory xmlns="http://tempuri.org/"><UserKey>${this.user_name}</UserKey></User_GetDirectory></s:Body></s:Envelope>`;

    return this.http.post(baseURL, body, {
      headers: new HttpHeaders()
        .set('Content-Type', 'text/xml; charset=utf-8')
        .append('Accept', '*/*')
        .append('Access-Control-Allow-Methods', 'GET,POST')
        .append('Access-Control-Allow-Origin', '*')
        .append('Content-Encoding', 'gzip, deflate, br')
        .append('SOAPAction', soapAction),
      responseType: 'text'
    });
  }

  getPhoneContacts(): any {
    return this.store.select(getPhoneContactsState);
  }

  toggleDnd(): any {
    const soapAction = `"http://tempuri.org/IPBXControl/ToggleDnd"`;

    const body = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><ToggleDnd xmlns="http://tempuri.org/"><ClientID>${this.user_id}</ClientID><UserID>${this.user_name}</UserID></ToggleDnd></s:Body></s:Envelope> `;

    return this.http.post(baseURL, body, {
      headers: new HttpHeaders()
        .set('Content-Type', 'text/xml; charset=utf-8')
        .append('Accept', '*/*')
        .append('Access-Control-Allow-Methods', 'GET,POST')
        .append('Access-Control-Allow-Origin', '*')
        .append('Content-Encoding', 'gzip, deflate, br')
        .append('SOAPAction', soapAction),
      responseType: 'text'
    });
  }
}
