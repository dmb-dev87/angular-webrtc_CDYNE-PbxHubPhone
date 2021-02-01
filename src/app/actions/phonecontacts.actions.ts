import { Action } from '@ngrx/store';

export enum ActionTypes {
  LoadPhoneContactsBegin = `[PhoneContacts] Load data begin`,
  LoadPhoneContactsSuccess = `[PhoneContacts] Load data success`,
  LoadPhoneContactsFailer = `[PhoneContacts] Load data failure`,
}

export class LoadPhoneContactsBegin implements Action {
  readonly type = ActionTypes.LoadPhoneContactsBegin;
}

export class LoadPhoneContactsSuccess implements Action {
  readonly type = ActionTypes.LoadPhoneContactsSuccess;

  constructor(public payload: {data: any}) {}
}

export class LoadPhoneContactsFailer implements Action {
  readonly type = ActionTypes.LoadPhoneContactsFailer;

  constructor(public payload: {error: any}) {}
}

export type ActionsUnion = LoadPhoneContactsBegin | LoadPhoneContactsSuccess | LoadPhoneContactsFailer;
