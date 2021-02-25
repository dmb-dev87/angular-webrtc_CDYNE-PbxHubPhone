import * as fromMessageRecords from './../actions/messagerecords.actions';
import { MessageRecord } from './../models/messagehistory';

export interface MessageRecordsState {
  messageRecords: MessageRecord[];
  loading: boolean;
  error: any;
}

export const initialState: MessageRecordsState = {
  messageRecords: [],
  loading: false,
  error: null  
};

export function reducer(
  state = initialState,
  action: fromMessageRecords.ActionsUnion
): MessageRecordsState {
  switch (action.type) {
    case fromMessageRecords.ActionTypes.LoadMessageRecordsBegin: {
      return {
        ...state,
        loading: true,
        error: null
      };
    }
    case fromMessageRecords.ActionTypes.LoadMessageRecordsSuccess: {
      return {
        ...state,
        loading: false,
        messageRecords: action.payload.records
      };
    }
    case fromMessageRecords.ActionTypes.LoadMessageRecordsFailure: {
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

export const getMessageRecords = (state: MessageRecordsState) => state.messageRecords;