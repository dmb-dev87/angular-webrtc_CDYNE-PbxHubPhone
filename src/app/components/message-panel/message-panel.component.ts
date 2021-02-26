import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { PhoneContact } from '../../models/phonecontact';
import { PbxControlService } from '../../services/pbxcontrol.service';
import { MessageHistory, MessageRecord } from '../../models/messagehistory';
import { act } from '@ngrx/effects';

@Component({
  selector: 'app-message-panel',
  templateUrl: './message-panel.component.html',
  styleUrls: ['./message-panel.component.scss']
})
export class MessagePanelComponent implements OnInit, AfterViewInit  {
  messageStr: string;
  phoneContacts: Array<PhoneContact> = [];  

  @Output() sendMessage = new EventEmitter<{extension: string, message: string}>();

  @Input() activeRecords: Array<MessageRecord>;
  @Input() selectedExtension: string;
  @Input() curName: string;

  constructor(private pbxControlService: PbxControlService) { 
    this.pbxControlService.getPhoneContacts().subscribe(phonecontacts => {
      this.phoneContacts = phonecontacts.data;
    });

    if (this.selectedExtension !== `` && this.selectedExtension !== undefined) {
      this.getActiveRecords();
    }
  }

  ngOnInit(): void {
    
  }

  ngAfterViewInit(): void {
    if (this.selectedExtension !== `` && this.selectedExtension !== undefined) {
      this.getActiveRecords();
    }
  }

  getActiveRecords(): void {
    this.pbxControlService.getMessageHistories().subscribe(histories=> {
      const messageHistories: Array<MessageHistory> = histories.messageHistories;
      const activeHistory = messageHistories.find(e => e.extension === this.selectedExtension);
      this.activeRecords = activeHistory.records;      
    })
    const activeContact = this.phoneContacts.find(e => e.extension === this.selectedExtension);
    this.curName = activeContact.firstName + ` ` + activeContact.lastName;
  }

  onSelectContact(extension: string): void {
    this.selectedExtension = extension;
    this.getActiveRecords();
  }

  onSendMessage(): void {
    const messageStr = this.messageStr;
    this.messageStr = ``;

    if (this.selectedExtension === undefined) {
      return;
    }
    this.sendMessage.emit({extension: this.selectedExtension, message: messageStr});
    const newMessage: MessageRecord = {
      body: messageStr,
      datetime: ``,
      messageId: 0,
      sent: true
    };
    this.activeRecords = Object.assign([], this.activeRecords);
    this.activeRecords.push(newMessage);
    this.pbxControlService.addMessageRecord(this.selectedExtension, newMessage);
  }

}
