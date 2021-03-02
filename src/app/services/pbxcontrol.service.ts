import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Store } from '@ngrx/store';

import * as PhoneContactsActions from '../actions/phonecontacts.actions';
import * as PhoneUserActions from '../actions/phoneuser.actions';
import * as MessageHistoriesActions from '../actions/messagehistories.actions';
import * as MessageContactsActions from '../actions/messagecontacts.actions';

import { AppState, getMessageHistoriesState, getPhoneContactsState, getPhoneUserState, getMessageContactsState } from '../reducers';

import { parseMessageRecords } from './../utilities/parse-utils';
import { MessageHistory, MessageRecord } from '../models/messagehistory';
import { MessageContact } from '../models/messagecontact';
import { PhoneContact } from '../models/phonecontact';

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
  
  constructor(private store: Store<AppState>, private http: HttpClient) {}

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

  toggleDnd(): any {
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
    });
  }

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

  loadMessageHistories(contacts: Array<MessageContact>): void {
    this.store.dispatch(new MessageHistoriesActions.LoadMessageHistoriesBegin({messageContacts: contacts}));
  }

  async getHistories(messageContacts: Array<MessageContact>) {
    let messageHistories: Array<MessageHistory> = [];
    await Promise.all(messageContacts.map(async (contact) => {
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
    const user_name = localStorage.getItem(`user_name`);
    let records: Array<MessageRecord> = [];
    const soapAction = `"http://tempuri.org/IPBXControl/GetMessages"`;

    const body = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><GetMessages xmlns="http://tempuri.org/"><Username>${user_name}</Username><Extension>${extension}</Extension><messageid>${messageId}</messageid></GetMessages></s:Body></s:Envelope>`;

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

  deleteMessageContact(hideContact: MessageContact): void {
    this.store.dispatch(new MessageContactsActions.DeleteMessageContactBegin({contact: hideContact}));
  }

  async messageHideConversation(hideContact: MessageContact) {
    const user_name = localStorage.getItem(`user_name`);

    var messageContacts: Array<MessageContact> = [];

    const soapAction = `"http://tempuri.org/IPBXControl/Message_HideConversation"`;

    const body = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><Message_HideConversation xmlns="http://tempuri.org/"><Username>${user_name}</Username><Extension>${hideContact.extension}</Extension></Message_HideConversation></s:Body></s:Envelope>`;

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

    this.getMessageContacts().subscribe(contacts => {
      messageContacts = Object.assign([], contacts.contacts);
      messageContacts.forEach( (item, index) => {
        if(item === hideContact) messageContacts.splice(index, 1);
      });
    });
    return messageContacts;
  }

  addMessageContact(addContact: MessageContact): void {
    this.store.dispatch(new MessageContactsActions.AddMessageContactBegin({contact: addContact}));
  }

  async messageActivateConversation(addContact: MessageContact) {
    const user_name = localStorage.getItem(`user_name`);

    var messageContacts: Array<MessageContact> = [];

    const soapAction = `"http://tempuri.org/IPBXControl/Message_ActivateConversation"`;

    const body = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><Message_ActivateConversation xmlns="http://tempuri.org/"><Username>${user_name}</Username><Extension>${addContact.extension}</Extension></Message_ActivateConversation></s:Body></s:Envelope>`;

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

    var messageContacts: Array<MessageContact> = [];
    this.getMessageContacts().subscribe(contacts => {
      messageContacts = Object.assign([], contacts.contacts);
      messageContacts.push(addContact);
    })
    return messageContacts;
  }

  addMessageHistory(contact: MessageContact): any {
    this.store.dispatch(new MessageHistoriesActions.AddMessageHistoryBegin({messageContact: contact}));
  }

  async addMessageHistoryToState(contact: MessageContact) {
    var messageHistories: Array<MessageHistory> = [];

    const records = await this.getMessages(contact.extension);

    this.getMessageHistories().subscribe(histories => {
      messageHistories = Object.assign([], histories.messageHistories);
      messageHistories.push({extension: contact.extension, records: records});
    });
    return messageHistories;
  }

  deleteMessageHistory(contact: MessageContact): any {
    this.store.dispatch(new MessageHistoriesActions.DeleteMessageHistoryBegin({messageContact: contact}));
  }

  async deleteMessageHistoryFromState(contact: MessageContact) {
    var messageHistories: Array<MessageHistory> = [];

    this.getMessageHistories().subscribe(histories => {
      messageHistories = Object.assign([], histories.messageHistories);
      messageHistories.forEach( (item, index) => {
        if(item.extension === contact.extension) messageHistories.splice(index, 1);
      });
    })
  }
}
