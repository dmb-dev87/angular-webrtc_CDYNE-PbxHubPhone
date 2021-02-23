import { Component, OnInit, AfterViewInit, Input, Output } from '@angular/core';
import { getButton, getInputValue, setButtonsDisabled } from '../../utilities/ui-utils';
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
  
  @Input() phoneContacts: PhoneContact[] = [];

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const numberToggle = getButton(`number-toggle`);
    numberToggle.addEventListener(`click`, () => {
      this.numberBtnToggle = !this.numberBtnToggle;
      this.searchBtnToggle = false;
    });

    const searchBtn = getButton(`search-toggle`);
    searchBtn.addEventListener(`click`, () => {
      // this.searchResult = this._phoneContacts;
      this.searchBtnToggle = !this.searchBtnToggle;
      this.numberBtnToggle = false;      
    });
  }

  searchContact(): void {
    const searchWord = getInputValue(`call-number`);

    setButtonsDisabled([
      {id: `end-call`, disabled: true}, 
      {id: `mute-btn`, disabled: true}, 
      {id: `hold-btn`, disabled: true}, 
      {id: `transfer-call`, disabled: true}]);

    if (searchWord) {
      this.searchBtnToggle = true;
      this.numberBtnToggle = false;
      setButtonsDisabled([{id: `begin-call`, disabled: false}]); 
      this.searchResult = this.phoneContacts.filter((ele, i, array) => {
        const eleStr = ele.extension + ele.firstName + ele.lastName;
        const arrayelement = eleStr.toLowerCase();
        return arrayelement.includes(searchWord);
      });
    }
    else {      
      setButtonsDisabled([{id: `begin-call`, disabled: true}]);
      this.searchResult = [];
    }
  }

}
