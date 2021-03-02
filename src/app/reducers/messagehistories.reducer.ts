import * as fromMessageHistories from './../actions/messagehistories.actions';
import { MessageHistory } from './../models/messagehistory';

export interface MessageHistoriesState {
  messageHistories: MessageHistory[];
  loading: boolean;
  error: any;
}

export const initialState: MessageHistoriesState = {
  messageHistories: [],
  loading: false,
  error: null  
};

export function reducer(
  state = initialState,
  action: fromMessageHistories.ActionsUnion
): MessageHistoriesState {
  switch (action.type) {
    case fromMessageHistories.ActionTypes.LoadMessageHistoriesBegin: {
      return {
        ...state,
        loading: true,
        error: null
      };
    }
    case fromMessageHistories.ActionTypes.LoadMessageHistoriesSuccess: {
      return {
        ...state,
        loading: false,
        messageHistories: action.payload.histories
      };
    }
    case fromMessageHistories.ActionTypes.LoadMessageHistoriesFailure: {
      return {
        ...state,
        loading: false,
        error: action.payload.error
      };
    }
    case fromMessageHistories.ActionTypes.AddMessageRecordBegin: {
      return {
        ...state,
        loading: true,
        error: null
      };
    }
    case fromMessageHistories.ActionTypes.AddMessageRecordSuccess: {
      return {
        ...state,
        loading: false,
        messageHistories: action.payload.histories
      };
    }
    case fromMessageHistories.ActionTypes.AddMessageRecordFailure: {
      return {
        ...state,
        loading: false,
        error: action.payload.error
      };
    }
    case fromMessageHistories.ActionTypes.AddMessageHistoryBegin: {
      return {
        ...state,
        loading: true,
        error: null
      };
    }
    case fromMessageHistories.ActionTypes.AddMessageHistorySuccess: {
      return {
        ...state,
        loading: false,
        messageHistories: action.payload.histories
      };
    }
    case fromMessageHistories.ActionTypes.AddMessageHistoryFailure: {
      return {
        ...state,
        loading: false,
        error: action.payload.error
      };
    }
    case fromMessageHistories.ActionTypes.DeleteMessageHistoryBegin: {
      return {
        ...state,
        loading: true,
        error: null
      };
    }
    case fromMessageHistories.ActionTypes.DeleteMessageHistorySuccess: {
      return {
        ...state,
        loading: false,
        messageHistories: action.payload.histories
      };
    }
    case fromMessageHistories.ActionTypes.DeleteMessageHistoryFailure: {
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

export const getMessageHistories = (state: MessageHistoriesState) => state.messageHistories;