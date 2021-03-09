import * as fromPhoneState from './../actions/phonestate.actions';
import { PhoneState } from '../models/phonestate';

export interface PhoneStateState {
  phoneState: PhoneState;
  loading: boolean;
  error: any;
}

export const initialState: PhoneStateState = {
  phoneState: null,
  loading: false,
  error: null
};

export function reducer(
  state = initialState,
  action: fromPhoneState.ActionsUnion
): PhoneStateState {
  switch (action.type) {
    case fromPhoneState.ActionTypes.LoadPhoneStateBegin: {
      return {
        ...state,
        loading: true,
        error: null
      };
    }
    case fromPhoneState.ActionTypes.LoadPhoneStateSuccess: {
      return {
        ...state,
        loading: false,
        phoneState: action.payload.phoneState
      };
    }
    case fromPhoneState.ActionTypes.LoadPhoneStateFailer: {
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

export const getPhoneState = (state: PhoneStateState) => state.phoneState;