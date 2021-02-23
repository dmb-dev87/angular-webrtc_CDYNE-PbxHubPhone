import * as fromCallStatus from '../actions/phonestatus.actions';

export interface PhoneStatusState {
  callerId: string;
  callStatus: string;
}

export const initialState: PhoneStatusState = {
  callerId: ``,
  callStatus: `Unregistered`,
}

export function reducer(
  state = initialState,
  action: fromCallStatus.ActionsUnion
): PhoneStatusState {
  switch (action.type) {
    case fromCallStatus.ActionTypes.UpdateCallerId: {
      return {
        ...state,
        callerId: action.callerId
      };
    }
    case fromCallStatus.ActionTypes.UpdateCallStatus: {
      return {
        ...state,
        callStatus: action.callStatus
      }
    }
  }
}

export const getCallerId = (state: PhoneStatusState) => state.callerId;
export const getCallStatus = (state: PhoneStatusState) => state.callStatus;