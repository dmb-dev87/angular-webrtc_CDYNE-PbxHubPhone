import { Action } from '@ngrx/store';

export enum ActionTypes {
  LoadPhoneUserBegin = `[PhoneUser] Load data begin`,
  LoadPhoneUserSuccess = `[PhoneUser] Load data success`,
  LoadPhoneUserFailer = `[PhoneUser] Load data failure`,
}

export class LoadPhoneUserBegin implements Action {
  readonly type = ActionTypes.LoadPhoneUserBegin;

  constructor(public payload: {email: string}) {}
}

export class LoadPhoneUserSuccess implements Action {
  readonly type = ActionTypes.LoadPhoneUserSuccess;

  constructor(public payload: {user: any}) {}
}

export class LoadPhoneUserFailure implements Action {
  readonly type = ActionTypes.LoadPhoneUserFailer;

  constructor(public payload: {error: any}) {}
}

export type ActionsUnion = LoadPhoneUserBegin | LoadPhoneUserSuccess | LoadPhoneUserFailure;
