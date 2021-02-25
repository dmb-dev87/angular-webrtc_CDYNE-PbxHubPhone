import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { PhoneContact } from '../../models/phonecontact';
import { PbxControlService } from '../../services/pbxcontrol.service';
import { MessageHistory, MessageRecord } from '../../models/messagehistory';

@Component({
  selector: 'app-message-panel',
  templateUrl: './message-panel.component.html',
  styleUrls: ['./message-panel.component.scss']
})
export class MessagePanelComponent implements OnInit, AfterViewInit {
  messageStr: string;
  phoneContacts: Array<PhoneContact> = [];

  @Output() sendMessage = new EventEmitter<{extension: string, message: string}>();

  @Input() activeRecords: Array<MessageRecord>;
  @Input() selectedExtension: string;

  constructor(private pbxControlService: PbxControlService) { }

  ngOnInit(): void {
    this.pbxControlService.getPhoneContacts().subscribe(phonecontacts => {
      this.phoneContacts = phonecontacts.data;
    });
  }

  ngAfterViewInit(): void {
    if (this.selectedExtension !== ``) {
      this.getActiveRecords();
    }
  }

  getActiveRecords(): void {
    // this.pbxControlService.loadMessageRecords(this.selectedExtension);

    // this.pbxControlService.getMessageHistories().subscribe(records => {
    //   this.activeRecords = records.messagerecords;
    //   console.log(`++++++++++++++++++++++++++ Active Records: `, this.activeRecords);  
    // });
    this.pbxControlService.getMessageHistories().subscribe(histories=> {
      console.log(`++++++++++++++++++++++++ histories`, histories);
      const messageHistories: Array<MessageHistory> = histories.messageHistories;
      const activeHistory = messageHistories.find(e => e.extension === this.selectedExtension);
      console.log(`++++++++++++++++++++++++ Active History: `, activeHistory);
      this.activeRecords = activeHistory.records;
      console.log(`++++++++++++++++++++++++++ Active Records: `, this.activeRecords);
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
    this.activeRecords.push(new MessageRecord(messageStr, '', undefined, true));
    console.log(`++++++++++++++++++++++++++ Active Records: `, this.activeRecords);
  }

}
