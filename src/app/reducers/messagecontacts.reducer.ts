import * as fromMessageContacts from './../actions/messagecontacts.actions';
import { MessageContact } from './../models/messagecontact';

export interface MessageContactsState {
  contacts: MessageContact[];
  loading: boolean;
  error: any;
}

export const initialState: MessageContactsState = {
  contacts: [],
  loading: false,
  error: null
};

export function reducer(
  state = initialState,
  action: fromMessageContacts.ActionsUnion
): MessageContactsState {
  switch (action.type) {
    case fromMessageContacts.ActionTypes.LoadMessageContactsBegin: {
      return {
        ...state,
        loading: true,
        error: null
      };
    }
    case fromMessageContacts.ActionTypes.LoadMessageContactsSuccess: {
      return {
        ...state,
        loading: false,
        contacts: action.payload.contacts
      };
    }
    case fromMessageContacts.ActionTypes.LoadMessageContactsFailure: {
      return {
        ...state,
        loading: false,
        error: action.payload.error
      };
    }
    case fromMessageContacts.ActionTypes.DeleteMessageContactBegin: {
      return {
        ...state,
        loading: true,
        error: null
      };
    }
    case fromMessageContacts.ActionTypes.DeleteMessageContactSuccess: {
      let newContacts = Object.assign([], state.contacts);
      const hideContact = action.payload.contact;
      newContacts.forEach((item, index) => {
        if (item === hideContact.contact) {
          newContacts.splice(index, 1);
        }
      });
      return {
        ...state,
        loading: false,
        contacts: newContacts
      };
    }
    case fromMessageContacts.ActionTypes.DeleteMessageContactFailure: {
      return {
        ...state,
        loading: false,
        contacts: action.payload.error
      }
    }
    case fromMessageContacts.ActionTypes.AddMessageContactBegin: {
      return {
        ...state,
        loading: true,
        error: null
      };
    }
    case fromMessageContacts.ActionTypes.AddMessageContactSuccess: {
      let newContacts = Object.assign([], state.contacts);
      const addContact = action.payload.contact;
      newContacts.push(addContact.contact);
      return {
        ...state,
        loading: false,
        contacts: newContacts
      };
    }
    case fromMessageContacts.ActionTypes.AddMessageContactFailure: {
      return {
        ...state,
        loading: false,
        contacts: action.payload.error
      }
    }
    default: {
      return state;
    }
  }
}

export const getMessageContacts = (state: MessageContactsState) => state.contacts;