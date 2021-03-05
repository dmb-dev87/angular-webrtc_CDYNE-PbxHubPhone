import * as fromPhoneUser from './../actions/phoneuser.actions';
import { PhoneUser } from '../models/phoneuser';

export interface PhoneUserState {
  user: PhoneUser;
  loading: boolean;
  error: any;
}

export const initialState: PhoneUserState = {
  user: null,
  loading: false,
  error: null
};

export function reducer(
  state = initialState,
  action: fromPhoneUser.ActionsUnion
): PhoneUserState {
  switch (action.type) {
    case fromPhoneUser.ActionTypes.LoadPhoneUserBegin: {
      return {
        ...state,
        loading: true,
        error: null
      };
    }
    case fromPhoneUser.ActionTypes.LoadPhoneUserSuccess: {
      return {
        ...state,
        loading: false,
        user: action.payload.user
      };
    }
    case fromPhoneUser.ActionTypes.LoadPhoneUserFailer: {
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

export const getPhoneUser = (state: PhoneUserState) => state.user;
