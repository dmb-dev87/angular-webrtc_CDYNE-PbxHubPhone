import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';

import * as PhoneUserActions from './../actions/phoneuser.actions';
import { AppState, getPhoneUserState } from '../reducers';


@Injectable({
  providedIn: 'root'
})
export class PhoneUserService {

  constructor(private store: Store<AppState>, private http: HttpClient) {}

  loadData(): any {
    return this.http.get(`/assets/fake-db/phoneuser.json`);
  }

  load(): void {
    this.store.dispatch(new PhoneUserActions.LoadPhoneUserBegin());
  }

  getPhoneUser(): any {
    return this.store.select(getPhoneUserState);
  }
}
