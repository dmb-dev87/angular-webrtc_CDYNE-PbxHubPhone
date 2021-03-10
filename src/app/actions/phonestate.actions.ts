import { Action } from '@ngrx/store';

export enum ActionTypes {
  LoadPhoneStateBegin = `[PhoneState] Load data begin`,
  LoadPhoneStateSuccess = `[PhoneState] Load data success`,
  LoadPhoneStateFailer = `[PhoneState] Load data failure`,
}

export class LoadPhoneStateBegin implements Action {
  readonly type = ActionTypes.LoadPhoneStateBegin;

  constructor(public payload: {extension: string}) {}
}

export class LoadPhoneStateSuccess implements Action {
  readonly type = ActionTypes.LoadPhoneStateSuccess;

  constructor(public payload: {phoneState: any}) {}
}

export class LoadPhoneStateFailure implements Action {
  readonly type = ActionTypes.LoadPhoneStateFailer;

  constructor(public payload: {error: any}) {}
}

export type ActionsUnion = LoadPhoneStateBegin | LoadPhoneStateSuccess | LoadPhoneStateFailure;