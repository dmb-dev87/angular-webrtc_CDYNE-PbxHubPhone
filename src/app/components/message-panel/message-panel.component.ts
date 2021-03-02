import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ElementRef, ViewChild, ContentChildren, QueryList, ViewChildren } from '@angular/core';
import { MessageContact } from '../../models/messagecontact';
import { PbxControlService } from '../../services/pbxcontrol.service';
// import { MessageHistory, MessageRecord } from '../../models/messagehistory';
import { MessageHistory } from '../../models/messagehistory';
import { PhoneContact } from 'src/app/models/phonecontact';
import { getInputValue, setInputValue } from '../../utilities/ui-utils';

@Component({
  selector: 'app-message-panel',
  templateUrl: './message-panel.component.html',
  styleUrls: ['./message-panel.component.scss']
})
export class MessagePanelComponent implements OnInit, AfterViewInit  {
  @ViewChildren('messages') messages: QueryList<any>;
  @ViewChild('scrollMe') scrollMe: ElementRef;
  messageStr: string;
  messageContacts: Array<MessageContact> = [];
  phoneContacts: Array<PhoneContact> = [];
  searchResult: Array<PhoneContact> = [];

  @Output() sendMessage = new EventEmitter<{extension: string, message: string}>();

  // @Input() activeRecords: Array<MessageRecord>;
  @Input() messageHistories: Array<MessageHistory>;
  @Input() selectedExtension: string;
  @Input() curName: string;

  constructor(private pbxControlService: PbxControlService) { 
    this.pbxControlService.getMessageContacts().subscribe(messagecontacts => {
      this.messageContacts = messagecontacts.contacts;
    });

    this.pbxControlService.getPhoneContacts().subscribe(phonecontacts => {
      this.phoneContacts = phonecontacts.data;
    });

    // this.getActiveRecords();
  }

  ngOnInit(): void {
    
  }

  ngAfterViewInit(): void {
    // this.getActiveRecords();
    this.scrollToBottom();
    this.messages.changes.subscribe(this.scrollToBottom);
  }

  // getActiveRecords(): void {
  //   if (this.selectedExtension !== `` && this.selectedExtension !== undefined) {
  //     this.pbxControlService.getMessageHistories().subscribe(histories=> {
  //       const messageHistories: Array<MessageHistory> = histories.messageHistories;
  //       const activeHistory = messageHistories.find(e => e.extension === this.selectedExtension);        
  //       this.activeRecords = activeHistory === undefined ? [] : activeHistory.records;      
  //     })
  //     const activeContact = this.messageContacts.find(e => e.extension === this.selectedExtension);
  //     this.curName = activeContact.firstName + ` ` + activeContact.lastName;
  //   }
  // }

  onSelectContact(extension: string): void {
    this.selectedExtension = extension;

    this.pbxControlService.loadMessageHistories(this.selectedExtension);
    
    this.pbxControlService.getMessageHistories().subscribe(historiesState => {      
      this.messageHistories = historiesState.histories;
    });
    // this.getActiveRecords();
  }

  onHideContact(extensio: string): void {
    const hideContact = this.messageContacts.find(e => e.extension === this.selectedExtension);    
    this.pbxControlService.deleteMessageContact(hideContact);
    this.pbxControlService.updateMessageHistories([]);
    // this.pbxControlService.deleteMessageHistoryFromState(hideContact);
    this.selectedExtension = undefined;
    this.curName = undefined;
  }

  onSendMessage(): void {
    const messageStr = this.messageStr;
    this.messageStr = ``;

    if (this.selectedExtension === undefined || messageStr === ``) {
      return;
    }
    this.sendMessage.emit({extension: this.selectedExtension, message: messageStr});
    // const newMessage: MessageRecord = {
    const newMessage: MessageHistory = {
      body: messageStr,
      datetime: new Date(),
      messageId: 0,
      sent: true
    };
    // this.activeRecords = Object.assign([], this.activeRecords);
    // this.activeRecords.push(newMessage);
    this.pbxControlService.addMessageHistory(newMessage);
  }

  scrollToBottom = () => {
    try {
      this.scrollMe.nativeElement.scrollTop = this.scrollMe.nativeElement.scrollHeight;
    } catch (err) {}
  }

  searchContact(): void {
    const searchWord = getInputValue(`search-text`);

    this.pbxControlService.getPhoneContacts().subscribe(phonecontacts => {
      this.phoneContacts = phonecontacts.data;
    });

    if (searchWord) {
      this.searchResult = this.phoneContacts.filter((ele, i, array) => {
        const eleStr = ele.extension + ele.firstName + ele.lastName;
        const arrayelement = eleStr.toLowerCase();
        return arrayelement.includes(searchWord);
      });
    }
    else {      
      this.searchResult = [];
    }
  }

  onClickOutsideSearch(e: Event): void {
    this.searchResult = [];
  }

  clickSearchList(extension: string): void {
    if (extension) {
      setInputValue(`search-text`, extension);
    }
    else {
      setInputValue(`search-text`, ``);
    }
    this.searchResult = [];
  }

  onAddContact(): void {
    const extension = getInputValue(`search-text`);
    const phoneContact = this.phoneContacts.find(e => e.extension === extension);
    const addContact: MessageContact = {
      extension: phoneContact.extension,
      firstName: phoneContact.firstName,
      lastName: phoneContact.lastName
    };
    this.pbxControlService.addMessageContact(addContact);
    // this.pbxControlService.addMessageHistory(addContact);
    this.selectedExtension = extension;
  }
}
