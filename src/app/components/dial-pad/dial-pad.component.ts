import { Component, OnInit, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { getButton, getInputValue, setInputValue, delInputValue, addInputValue } from '../../utilities/ui-utils';
import { PhoneContact } from '../../models/phonecontact';
import { PbxControlService } from '../../services/pbxcontrol.service';

@Component({
  selector: 'app-dial-pad',
  templateUrl: './dial-pad.component.html',
  styleUrls: ['./dial-pad.component.scss']
})
export class DialPadComponent implements OnInit, AfterViewInit {
  numberBtnToggle = false;
  searchBtnToggle = false;
  searchResult = [];

  private phoneContacts: Array<PhoneContact> = [];

  @Output() changeNumberEvent = new EventEmitter<string>();
  
  constructor(private pbxControlService: PbxControlService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const numberToggle = getButton(`number-toggle`);

    this.pbxControlService.getPhoneContacts().subscribe(phonecontacts => {
      this.phoneContacts = phonecontacts.contacts;
    })

    numberToggle.addEventListener(`click`, () => {
      this.numberBtnToggle = !this.numberBtnToggle;
      this.searchBtnToggle = false;
    });

    const searchBtn = getButton(`search-toggle`);
    searchBtn.addEventListener(`click`, () => {      
      this.searchResult = this.phoneContacts;
      this.searchBtnToggle = !this.searchBtnToggle;
      this.numberBtnToggle = false;      
    });
  }

  searchContact(): void {
    const searchWord = getInputValue(`call-number`);
    this.changeNumberEvent.emit(searchWord);

    if (searchWord) {
      this.searchBtnToggle = true;
      this.numberBtnToggle = false;
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

  clickSearchList(extension: string): void {
    if (extension) {
      setInputValue(`call-number`, extension);
    }
    else {
      setInputValue(`call-number`, ``);
    }
    this.searchResult = [];
    this.changeNumberEvent.emit(extension);
  }

  clickNumber(toneNum: string): void {
    if (toneNum === "clear") {
      delInputValue(`call-number`);
      return;
    }

    addInputValue(`call-number`, toneNum);

    const value = getInputValue(`call-number`);
    this.changeNumberEvent.emit(value);
  }

  onClickOutsideNumber(e: Event): void {
    const targetClass = (e.target as Element).className;
    const targetId = (e.target as Element).id;
    
    if (targetClass !== `fas fa-bars` && targetId !== `number-toggle`) {
      this.numberBtnToggle = false;
    }
  }

  onClickOutsideSearch(e: Event): void {
    const targetClass = (e.target as Element).className;
    const targetId = (e.target as Element).id;
    
    if (targetClass !== `fas fa-search` && targetId !== `search-toggle`) {
      this.searchBtnToggle = false;
    }
  }
}
