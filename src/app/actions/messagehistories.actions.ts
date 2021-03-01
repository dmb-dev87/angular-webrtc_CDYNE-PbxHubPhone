import { Action } from '@ngrx/store';
import { MessageRecord } from '../models/messagehistory';
import { PhoneContact } from '../models/phonecontact';

export enum ActionTypes {
  LoadMessageHistoriesBegin = `[MessageHistories] Load data begin`,
  LoadMessageHistoriesSuccess = `[MessageHitories] Load data success`,
  LoadMessageHistoriesFailure = `[MessageHitories] Load data failure`,
  AddMessageRecordBegin = `[MessageRecord] Add data begin`,
  AddMessageRecordSuccess = `[MessageRecord] Add data success`,
  AddMessageRecordFailure = `[MessageRecord] Add data failure`,
}

export class LoadMessageHistoriesBegin implements Action {
  readonly type = ActionTypes.LoadMessageHistoriesBegin;

  constructor(public phoneContacts: Array<PhoneContact>) {}
}

export class LoadMessageHistoriesSuccess implements Action {
  readonly type = ActionTypes.LoadMessageHistoriesSuccess;

  constructor(public payload: {histories: any}) {}
}

export class LoadMessageHistoriesFailure implements Action {
  readonly type = ActionTypes.LoadMessageHistoriesFailure;

  constructor(public payload: {error: any}) {}
}

export class AddMessageRecordBegin implements Action {
  readonly type = ActionTypes.AddMessageRecordBegin;

  constructor(public payload: {extension: string, messageRecord: MessageRecord}) {}
}

export class AddMessageRecordSuccess implements Action {
  readonly type = ActionTypes.AddMessageRecordSuccess;

  constructor(public payload: {histories: any}) {}
}

export class AddMessageRecordFailure implements Action {
  readonly type = ActionTypes.AddMessageRecordFailure;

  constructor(public payload: {error: any}) {}
}

export type ActionsUnion = LoadMessageHistoriesBegin | LoadMessageHistoriesSuccess | LoadMessageHistoriesFailure |
                            AddMessageRecordBegin | AddMessageRecordSuccess | AddMessageRecordFailure;