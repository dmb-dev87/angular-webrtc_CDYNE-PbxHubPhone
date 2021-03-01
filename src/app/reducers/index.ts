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
import * as fromMessageContacts from './messagecontacts.reducer';

export interface AppState {
  phoneuser: fromPhoneUser.PhoneUserState;
  phonecontacts: fromPhoneContacts.PhoneContactsState;
  messagehistories: fromMessageHistories.MessageHistoriesState;
  messagecontacts: fromMessageContacts.MessageContactsState;
}

export const reducers: ActionReducerMap<AppState> = {
  phoneuser: fromPhoneUser.reducer,
  phonecontacts: fromPhoneContacts.reducer,
  messagehistories: fromMessageHistories.reducer,
  messagecontacts: fromMessageContacts.reducer,
};

export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [] : [];

export const getPhoneUserState = (state: AppState) => state.phoneuser;
export const getPhoneContactsState = (state: AppState) => state.phonecontacts;
export const getMessageHistoriesState = (state: AppState) => state.messagehistories;
export const getMessageContactsState = (state: AppState) => state.messagecontacts;