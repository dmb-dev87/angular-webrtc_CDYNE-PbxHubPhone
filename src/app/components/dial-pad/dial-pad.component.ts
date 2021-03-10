import { Component, OnInit, AfterViewInit, Output, EventEmitter, Input } from '@angular/core';
import { getButton, getInputValue, setInputValue, delInputValue, addInputValue } from '../../utilities/ui-utils';
import { PhoneContact } from '../../models/phonecontact';

@Component({
  selector: 'app-dial-pad',
  templateUrl: './dial-pad.component.html',
  styleUrls: ['./dial-pad.component.scss']
})
export class DialPadComponent implements OnInit, AfterViewInit {
  numberBtnToggle = false;
  searchBtnToggle = false;
  searchResult = [];

  @Output() changeNumberEvent = new EventEmitter<string>();
  @Output() clickNumberEvent = new EventEmitter<string>();

  @Input() phoneContacts: Array<PhoneContact>;
  
  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const numberBtn = getButton(`number-toggle`);
    numberBtn.addEventListener(`click`, () => {
      setInputValue(`call-number`, ``);
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
    } 
    else {
      addInputValue(`call-number`, toneNum);
      this.clickNumberEvent.emit(toneNum);
    }

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