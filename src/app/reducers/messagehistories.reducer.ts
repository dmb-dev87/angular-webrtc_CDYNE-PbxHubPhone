import * as fromMessageHistories from './../actions/messagehistories.actions';
import { MessageHistory } from './../models/messagehistory';

export interface MessageHistoriesState {
  histories: MessageHistory[];
  loading: boolean;
  error: any;
}

export const initialState: MessageHistoriesState = {
  histories: [],
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
        histories: action.payload.histories
      };
    }
    case fromMessageHistories.ActionTypes.LoadMessageHistoriesFailure: {
      return {
        ...state,
        loading: false,
        error: action.payload.error
      }
    }
    case fromMessageHistories.ActionTypes.UpdateMessageHistories: {      
      return {
        ...state,
        loading: false,
        histories: action.payload.histories,
        error: null
      };
    }
    case fromMessageHistories.ActionTypes.AddMessageHistory: {
      let newHistories = Object.assign([], state.histories);
      newHistories.push(action.payload.history);
      return {
        ...state,
        loading: false,
        histories: newHistories,
        error: null
      };
    }
    default: {
      return state;
    }
  }
}

export const getMessageHistories = (state: MessageHistoriesState) => state.histories;