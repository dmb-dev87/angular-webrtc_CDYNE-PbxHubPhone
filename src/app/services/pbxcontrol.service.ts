import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Store } from '@ngrx/store';

import * as PhoneContactsActions from '../actions/phonecontacts.actions';
import * as PhoneUserActions from '../actions/phoneuser.actions';
import * as MessageHistoriesActions from '../actions/messagehistories.actions';

import { AppState, getMessageHistoriesState, getPhoneContactsState, getPhoneUserState } from '../reducers';
import { PhoneContact } from '../models/phonecontact';

import { parseMessageRecords } from './../utilities/parse-utils';
import { MessageHistory, MessageRecord } from '../models/messagehistory';
import { Messager } from 'sip.js';
import { Observable, of } from 'rxjs';

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
  
  constructor(private store: Store<AppState>, private http: HttpClient) {}

  addMessageRecord(extension: string, messageRecord: MessageRecord): void {
    this.store.dispatch(new MessageHistoriesActions.AddMessageRecordBegin({extension: extension, messageRecord: messageRecord}));
  }

  async addMessageRecordToHistory(payload: any) {
    var records: Array<MessageRecord> = [];
    var messageHistories: Array<MessageHistory> = [];

    this.getMessageHistories().subscribe(histories => {
      messageHistories = histories.messageHistories;
      let activeHistory: MessageHistory = messageHistories.find(e => e.extension === payload.extension);
      let index = messageHistories.indexOf(activeHistory);
      records = Object.assign([], activeHistory.records);
      records.push(payload.messageRecord);
      messageHistories = Object.assign([], messageHistories);
      messageHistories[index] = {extension:payload.extension, records: records};      
    });
    return messageHistories;
  }

  loadMessageHistories(contacts: Array<PhoneContact>): void {
    this.user_name = localStorage.getItem(`user_name`);
    this.store.dispatch(new MessageHistoriesActions.LoadMessageHistoriesBegin(contacts));
  }

  async getHistories(phoneContacts: Array<PhoneContact>) {
    let messageHistories: Array<MessageHistory> = [];
    await Promise.all(phoneContacts.map(async (contact) => {
      await this.getMessages(contact.extension).then(res => {
        messageHistories.push({
          extension: contact.extension,
          records: res
        });
      });      
    }));
    return messageHistories;
  }

  async getMessages(extension: string, messageId: number = 0) {
    let records: Array<MessageRecord> = [];
    const soapAction = `"http://tempuri.org/IPBXControl/GetMessages"`;

    const body = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><GetMessages xmlns="http://tempuri.org/"><Username>${this.user_name}</Username><Extension>${extension}</Extension><messageid>${messageId}</messageid></GetMessages></s:Body></s:Envelope>`;

    let res: string = await this.http.post(baseURL, body, {
      headers: new HttpHeaders()
        .set('Content-Type', 'text/xml; charset=utf-8')
        .append('Accept', '*/*')
        .append('Access-Control-Allow-Methods', 'GET,POST')
        .append('Access-Control-Allow-Origin', '*')
        .append('Content-Encoding', 'gzip, deflate, br')
        .append('SOAPAction', soapAction),
      responseType: 'text'
    }).toPromise()

    records = parseMessageRecords(res);

    return records;
  }

  getMessageHistories(): any {
    return this.store.select(getMessageHistoriesState);
  }

  loadPhoneUser(email: string): void {
    this.store.dispatch(new PhoneUserActions.LoadPhoneUserBegin(email));
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
    this.user_id = localStorage.getItem(`user_id`);
    this.user_name = localStorage.getItem(`user_name`);
    this.store.dispatch(new PhoneContactsActions.LoadPhoneContactsBegin());
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
