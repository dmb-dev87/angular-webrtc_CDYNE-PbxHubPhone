import * as fromPhoneContacts from './../actions/phonecontacts.actions';
import { PhoneContact } from '../models/phonecontact';

export interface PhoneContactsState {
  contacts: PhoneContact[];
  loading: boolean;
  error: any;
}

export const initialState: PhoneContactsState = {
  contacts: [],
  loading: false,
  error: null
};

export function reducer(
  state = initialState,
  action: fromPhoneContacts.ActionsUnion
): PhoneContactsState {
  switch (action.type) {
    case fromPhoneContacts.ActionTypes.LoadPhoneContactsBegin: {
      return {
        ...state,
        loading: true,
        error: null
      };
    }
    case fromPhoneContacts.ActionTypes.LoadPhoneContactsSuccess: {
      return {
        ...state,
        loading: false,
        contacts: action.payload.contacts
      };
    }
    case fromPhoneContacts.ActionTypes.LoadPhoneContactsFailer: {
      return {
        ...state,
        loading: false,
        error: action.payload.error
      };
    }
    default: {
      return state;
    }
  }
}

export const getPhoneContacts = (state: PhoneContactsState) => state.contacts;
