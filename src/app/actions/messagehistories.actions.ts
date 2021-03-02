import { Action } from '@ngrx/store';
import { MessageContact } from '../models/messagecontact';
import { MessageRecord } from '../models/messagehistory';

export enum ActionTypes {
  LoadMessageHistoriesBegin = `[MessageHistories] Load data begin`,
  LoadMessageHistoriesSuccess = `[MessageHitories] Load data success`,
  LoadMessageHistoriesFailure = `[MessageHitories] Load data failure`,
  AddMessageHistoryBegin = `[MessageHistory] Add data begin`,
  AddMessageHistorySuccess = `[MessageHistory] Add data success`,
  AddMessageHistoryFailure = `[MessageHistory] Add data failure`,
  DeleteMessageHistoryBegin = `[MessageHistory] Delete data begin`,
  DeleteMessageHistorySuccess = `[MessageHistory] Delete data success`,
  DeleteMessageHistoryFailure = `[MessageHistory] Delete data failure`,
  AddMessageRecordBegin = `[MessageRecord] Add data begin`,
  AddMessageRecordSuccess = `[MessageRecord] Add data success`,
  AddMessageRecordFailure = `[MessageRecord] Add data failure`,
}

export class LoadMessageHistoriesBegin implements Action {
  readonly type = ActionTypes.LoadMessageHistoriesBegin;

  constructor(public payload: {messageContacts: Array<MessageContact>}) {}
}

export class LoadMessageHistoriesSuccess implements Action {
  readonly type = ActionTypes.LoadMessageHistoriesSuccess;

  constructor(public payload: {histories: any}) {}
}

export class LoadMessageHistoriesFailure implements Action {
  readonly type = ActionTypes.LoadMessageHistoriesFailure;

  constructor(public payload: {error: any}) {}
}

export class AddMessageHistoryBegin implements Action {
  readonly type = ActionTypes.AddMessageHistoryBegin;

  constructor(public payload: {messageContact: MessageContact}) {}
}

export class AddMessageHistorySuccess implements Action {
  readonly type = ActionTypes.AddMessageHistorySuccess;

  constructor(public payload: {histories: any}) {}
}

export class AddMessageHistoryFailure implements Action {
  readonly type = ActionTypes.AddMessageHistoryFailure;

  constructor(public payload: {error: any}) {}
}

export class DeleteMessageHistoryBegin implements Action {
  readonly type = ActionTypes.DeleteMessageHistoryBegin;

  constructor(public payload: {messageContact: MessageContact}) {}
}

export class DeleteMessageHistorySuccess implements Action {
  readonly type = ActionTypes.DeleteMessageHistorySuccess;

  constructor(public payload: {histories: any}) {}
}

export class DeleteMessageHistoryFailure implements Action {
  readonly type = ActionTypes.DeleteMessageHistoryFailure;

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

export type ActionsUnion = LoadMessageHistoriesBegin | LoadMessageHistoriesSuccess | LoadMessageHistoriesFailure 
                          | AddMessageRecordBegin | AddMessageRecordSuccess | AddMessageRecordFailure
                          | AddMessageHistoryBegin | AddMessageHistorySuccess | AddMessageHistoryFailure
                          | DeleteMessageHistoryBegin | DeleteMessageHistorySuccess | DeleteMessageHistoryFailure;