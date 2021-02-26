import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { PhoneContact } from '../../models/phonecontact';
import { PbxControlService } from '../../services/pbxcontrol.service';
import { MessageHistory, MessageRecord } from '../../models/messagehistory';

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

  constructor(private pbxControlService: PbxControlService) { 
    this.pbxControlService.getPhoneContacts().subscribe(phonecontacts => {
      this.phoneContacts = phonecontacts.data;
    });

    console.log(`+++++++++++++++++++++`, this.selectedExtension);

    if (this.selectedExtension !== `` && this.selectedExtension !== undefined) {
      this.getActiveRecords();
    }
  }

  ngOnInit(): void {
    
  }

  ngAfterViewInit(): void {
    console.log(`+++++++++++++++++++++`, this.selectedExtension);

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
