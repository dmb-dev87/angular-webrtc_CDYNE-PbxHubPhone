import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Store } from '@ngrx/store';

import * as PhoneStatusActions from '../actions/phonestatus.actions';

import { AppState, getPhoneStatusState } from '../reducers';
import { getCallStatus } from '../reducers/phonestatus.reducer';
import { stat } from 'fs';

@Injectable({
  providedIn: 'root'
})

export class PhoneStatusService {
  
  constructor(private store: Store<AppState>) {}

  updateCallerId(callerId: string): void {
    this.store.dispatch(new PhoneStatusActions.UpdateCallerId(callerId));
  }

  updateCallStatus(callStatus: string): void {
    this.store.dispatch(new PhoneStatusActions.UpdateCallStatus(callStatus));
  }

  getPhoneStatus(): any {
    return this.store.select(getPhoneStatusState);
  }
}