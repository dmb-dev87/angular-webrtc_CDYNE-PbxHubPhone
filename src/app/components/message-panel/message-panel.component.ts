import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { PhoneContact } from '../../models/phonecontact';
import { PbxControlService } from '../../services/pbxcontrol.service';

@Component({
  selector: 'app-message-panel',
  templateUrl: './message-panel.component.html',
  styleUrls: ['./message-panel.component.scss']
})
export class MessagePanelComponent implements OnInit, AfterViewInit {
  messageStr: string;
  phoneContacts: Array<PhoneContact> = [];
  selectExtension: string;

  @Output() sendMessage = new EventEmitter<{extension: string, message: string}>();

  constructor(private pbxControlService: PbxControlService) { }

  ngOnInit(): void {
    this.pbxControlService.getPhoneContacts().subscribe(phonecontacts => {
      this.phoneContacts = phonecontacts.data;
    });
  }

  ngAfterViewInit(): void {
    
  }

  onSelectContact(extension: string): void {
    this.selectExtension = extension;
  }

  onSendMessage(): void {
    const messageStr = this.messageStr;
    this.messageStr = ``;
    if (this.selectExtension === ``) {
      return;
    }
    
    this.sendMessage.emit({extension: this.selectExtension, message: messageStr});
  }

}
