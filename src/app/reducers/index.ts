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
import * as fromPhoneStatus from './phonestatus.reducer';

export interface AppState {
  phoneuser: fromPhoneUser.PhoneUserState;
  phonecontacts: fromPhoneContacts.PhoneContactsState;
  phonestatus: fromPhoneStatus.PhoneStatusState;
}

export const reducers: ActionReducerMap<AppState> = {
  phoneuser: fromPhoneUser.reducer,
  phonecontacts: fromPhoneContacts.reducer,
  phonestatus: fromPhoneStatus.reducer,
};

export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [] : [];

export const getPhoneUserState = (state: AppState) => state.phoneuser;
export const getPhoneContactsState = (state: AppState) => state.phonecontacts;
export const getPhoneStatusState = (state: AppState) => state.phonestatus;