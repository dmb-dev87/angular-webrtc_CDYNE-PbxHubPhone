import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ElementRef, ViewChild, QueryList, ViewChildren } from '@angular/core';
import { MessageContact } from '../../models/messagecontact';
import { PbxControlService } from '../../services/pbxcontrol.service';
import { MessageHistory } from '../../models/messagehistory';
import { PhoneContact } from 'src/app/models/phonecontact';
import { getInputValue, setInputValue } from '../../utilities/ui-utils';

@Component({
  selector: 'app-message-panel',
  templateUrl: './message-panel.component.html',
  styleUrls: ['./message-panel.component.scss']
})
export class MessagePanelComponent implements OnInit, AfterViewInit {
  @ViewChildren('messages') messages: QueryList<any>;
  @ViewChild('scrollMe') scrollMe: ElementRef;
  
  messageStr: string;  
  searchResult: Array<PhoneContact> = [];
  messageHistories: Array<MessageHistory> = [];
  selectedExtension: string = undefined;
  groupedMessages: Array<any> = [];
  todayDate: Date = null;

  @Output() sendMessage = new EventEmitter<{extension: string, message: string}>();

  @Input() curName: string;
  @Input() extensionsForReceived: Array<string>;
  @Input() messageContacts: Array<MessageContact>;
  @Input() phoneContacts: Array<PhoneContact>;

  constructor(private pbxControlService: PbxControlService) {
  }

  ngOnInit(): void {
    const today = new Date();
    this.todayDate = new Date(today.getTime() - (today.getTime() % 86400000) + today.getTimezoneOffset() * 60000);
  }

  ngAfterViewInit(): void {
    this.getMessageHistories();
    this.scrollToBottom();
    this.messages.changes.subscribe(this.scrollToBottom);
  }

  getMessageHistories(): void {
    if (this.selectedExtension) {
      this.pbxControlService.loadMessageHistories(this.selectedExtension);
      this.pbxControlService.getMessageHistories().subscribe(historiesState => {
        this.messageHistories = historiesState.histories;
        this.groupedMessages = this.groupByDate(this.messageHistories);
      });

      const activeContact = this.phoneContacts.find(e => e.extension === this.selectedExtension);
      if (activeContact === undefined) {
        this.curName = ``;
      } else {
        this.curName = activeContact.firstName + ` ` + activeContact.lastName;
      }
    }    
  }

  groupByDate(messages: Array<MessageHistory>): Array<any> {
    const grouped = [];
    messages.forEach((msg, index) => {
      const actualDay = new Date(msg.datetime.getTime() - (msg.datetime.getTime() % 86400000) + msg.datetime.getTimezoneOffset() * 60000);
      let group = grouped.find(e => e.actualDay.toString() === actualDay.toString());
      const messages = [];
      messages.push(msg);
      if (group === undefined) {
        grouped.push({
          actualDay: actualDay,
          messages: messages
        });        
      } else {
        group.messages.push(msg);
      }
    });
    return grouped;
  }

  onSelectContact(extension: string): void {
    this.messageHistories = [];
    this.selectedExtension = extension;
    this.getMessageHistories();
    this.extensionsForReceived.forEach((item, index) => {
      if(item === this.selectedExtension) {
        this.extensionsForReceived.splice(index, 1);
      }
    });
  }

  onHideContact(extension: string): void {
    this.selectedExtension = extension;
    const hideContact = this.messageContacts.find(e => e.extension === this.selectedExtension);
    this.pbxControlService.deleteMessageContact(hideContact);
    this.pbxControlService.updateMessageHistories([]);
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
    const newMessage: MessageHistory = {
      body: messageStr,
      datetime: new Date(),
      messageId: 0,
      sent: true
    };
    this.pbxControlService.addMessageHistory(newMessage);
  }

  scrollToBottom = () => {
    try {
      this.scrollMe.nativeElement.scrollTop = this.scrollMe.nativeElement.scrollHeight;
    } catch (err) {}
  }

  searchContact(): void {
    const searchWord = getInputValue(`search-text`);

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
    if (this.messageContacts.findIndex(e => e.extension === extension) === -1) {
      const phoneContact = this.phoneContacts.find(e => e.extension === extension);
      const addContact: MessageContact = {
        extension: phoneContact.extension,
        firstName: phoneContact.firstName,
        lastName: phoneContact.lastName
      };
      this.pbxControlService.addMessageContact(addContact);
    }
    this.selectedExtension = extension;
    this.getMessageHistories();
  }
}
