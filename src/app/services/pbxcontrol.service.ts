import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Store } from '@ngrx/store';
import * as PhoneContactsActions from '../actions/phonecontacts.actions';
import * as PhoneUserActions from '../actions/phoneuser.actions';
import * as MessageHistoriesActions from '../actions/messagehistories.actions';
import * as MessageContactsActions from '../actions/messagecontacts.actions';
import * as PhoneStateActions from '../actions/phonestate.actions';
import { AppState, getMessageHistoriesState, getPhoneContactsState, getPhoneUserState, getMessageContactsState, getPhoneStateState } from '../reducers';
import { environment } from '../../environments/environment';
import { MessageContact } from '../models/messagecontact';
import { PhoneUser } from '../models/phoneuser';
import { PhoneInfo } from '../models/phoneinfo';

export enum DndState {
  Enabled = `DND Enabled`,
  Disabled = `DND Disabled`,
  NotAllowed = `DND Not Allowed`
}

let baseURL = environment.pbxServiceBaseURL;

@Injectable({
  providedIn: 'root'
})
export class PbxControlService {  
  constructor(private store: Store<AppState>, private http: HttpClient) {
    const phoneInfo : PhoneInfo = JSON.parse(localStorage.getItem(`WebPhone`));
    if (phoneInfo) {
      baseURL = phoneInfo.phoneApi;
    }
  }

  loadPhoneState(extension: string): void {
    this.store.dispatch(new PhoneStateActions.LoadPhoneStateBegin({extension: extension}));
  }

  userGetState(extension: string): any {
    const user_name = localStorage.getItem(`user_name`);
    const soapAction = `"http://tempuri.org/IPBXControl/User_GetState"`;
    const body = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><User_GetState xmlns="http://tempuri.org/"><Username>${user_name}</Username><Extension>${extension}</Extension></User_GetState></s:Body></s:Envelope>`;

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

  getPhoneState(): any {
    return this.store.select(getPhoneStateState);
  }

  updatePhoneUser(phoneUser: PhoneUser): void {
    this.store.dispatch(new PhoneUserActions.UpdatePhoneUserBegin({user: phoneUser}));
  }

  loadPhoneUser(email: string): void {
    this.store.dispatch(new PhoneUserActions.LoadPhoneUserBegin({email: email}));
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

  getPhoneUser(): any {
    return this.store.select(getPhoneUserState);
  }

  loadPhoneContacts(): void {
    this.store.dispatch(new PhoneContactsActions.LoadPhoneContactsBegin());
  }

  userGetDirecotry(): any {
    const user_name = localStorage.getItem(`user_name`);    
    const soapAction = `"http://tempuri.org/IPBXControl/User_GetDirectory"`;
    const body = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><User_GetDirectory xmlns="http://tempuri.org/"><UserKey>${user_name}</UserKey></User_GetDirectory></s:Body></s:Envelope>`;

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

  toggleDnd(): Promise<any> {
    const user_name = localStorage.getItem(`user_name`);
    const user_id = localStorage.getItem(`user_id`);
    const soapAction = `"http://tempuri.org/IPBXControl/ToggleDnd"`;
    const body = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><ToggleDnd xmlns="http://tempuri.org/"><ClientID>${user_id}</ClientID><UserID>${user_name}</UserID></ToggleDnd></s:Body></s:Envelope> `;

    return this.http.post(baseURL, body, {
      headers: new HttpHeaders()
        .set('Content-Type', 'text/xml; charset=utf-8')
        .append('Accept', '*/*')
        .append('Access-Control-Allow-Methods', 'GET,POST')
        .append('Access-Control-Allow-Origin', '*')
        .append('Content-Encoding', 'gzip, deflate, br')
        .append('SOAPAction', soapAction),
      responseType: 'text'
    }).toPromise();
  }

  loadMessageContacts(): void {
    this.store.dispatch(new MessageContactsActions.LoadMessageContactsBegin());
  }

  messageGetActiveConversations(): any {
    const user_name = localStorage.getItem(`user_name`);
    const soapAction = `"http://tempuri.org/IPBXControl/Message_GetActiveConversations"`;
    const body =`<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><Message_GetActiveConversations xmlns="http://tempuri.org/"><UserKey>${user_name}</UserKey></Message_GetActiveConversations></s:Body></s:Envelope>`;

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

  getMessageContacts(): any {
    return this.store.select(getMessageContactsState);
  }

  addMessageContact(contact: any) {
    this.store.dispatch(new MessageContactsActions.AddMessageContactBegin({contact: contact}));
  }

  messageActivateConversation(addContact: MessageContact): any {
    const user_name = localStorage.getItem(`user_name`);
    const soapAction = `"http://tempuri.org/IPBXControl/Message_ActivateConversation"`;
    const body = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><Message_ActivateConversation xmlns="http://tempuri.org/"><Username>${user_name}</Username><Extension>${addContact.extension}</Extension></Message_ActivateConversation></s:Body></s:Envelope>`;

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

  deleteMessageContact(contact: any) {
    this.store.dispatch(new MessageContactsActions.DeleteMessageContactBegin({contact: contact}));
  }

  messageHideConversation(hideContact: MessageContact) {
    const user_name = localStorage.getItem(`user_name`);
    const soapAction = `"http://tempuri.org/IPBXControl/Message_HideConversation"`;
    const body = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><Message_HideConversation xmlns="http://tempuri.org/"><Username>${user_name}</Username><Extension>${hideContact.extension}</Extension></Message_HideConversation></s:Body></s:Envelope>`;

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

  loadMessageHistories(extension: string): void {
    this.store.dispatch(new MessageHistoriesActions.LoadMessageHistoriesBegin({extension: extension, messageId: 0}));
  }

  messageGetMessages(payload: any): any {
    const user_name = localStorage.getItem(`user_name`);
    const soapAction = `"http://tempuri.org/IPBXControl/Message_GetMessages"`;
    const body = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><Message_GetMessages xmlns="http://tempuri.org/"><Username>${user_name}</Username><Extension>${payload.extension}</Extension><messageid>${payload.messageId}</messageid></Message_GetMessages></s:Body></s:Envelope>`;

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

  getMessageHistories(): any {
    return this.store.select(getMessageHistoriesState);
  }

  updateMessageHistories(histories: any): void {
    this.store.dispatch(new MessageHistoriesActions.UpdateMessageHistories({histories: histories}));
  }

  addMessageHistory(history: any): void {
    this.store.dispatch(new MessageHistoriesActions.AddMessageHistory({history: history}));
  }
}