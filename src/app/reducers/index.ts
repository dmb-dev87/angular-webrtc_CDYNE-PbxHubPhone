import {
  ActionReducer,
  ActionReducerMap,
  createFeatureSelector,
  createSelector,
  MetaReducer
} from '@ngrx/store';

import { environment } from '../../environments/environment';
import * as fromPhoneUser from './phoneuser.reducer';
import * as fromPhoneContacts from './phonecontacts.reducer';
import * as fromMessageHistories from './messagehistories.reducer';
import * as fromMessageRecords from './messagerecords.reducer';

export interface AppState {
  phoneuser: fromPhoneUser.PhoneUserState;
  phonecontacts: fromPhoneContacts.PhoneContactsState;
  messagehistories: fromMessageHistories.MessageHistoriesState;
  messagerecords: fromMessageRecords.MessageRecordsState;
}

export const reducers: ActionReducerMap<AppState> = {
  phoneuser: fromPhoneUser.reducer,
  phonecontacts: fromPhoneContacts.reducer,
  messagehistories: fromMessageHistories.reducer,
  messagerecords: fromMessageRecords.reducer,
};

export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [] : [];

export const getPhoneUserState = (state: AppState) => state.phoneuser;
export const getPhoneContactsState = (state: AppState) => state.phonecontacts;
export const getMessageHistoriesState = (state: AppState) => state.messagehistories;
export const getMessageReocrdsState = (state: AppState) => state.messagerecords;