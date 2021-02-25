import { Action } from '@ngrx/store';

export enum ActionTypes {
  LoadMessageRecordsBegin = `[MessageRecords] Load data begin`,
  LoadMessageRecordsSuccess = `[MessageRecords] Load data success`,
  LoadMessageRecordsFailure = `[MessageRecords] Load data failure`,
}

export class LoadMessageRecordsBegin implements Action {
  readonly type = ActionTypes.LoadMessageRecordsBegin;

  constructor(public extension: string) {}
}

export class LoadMessageRecordsSuccess implements Action {
  readonly type = ActionTypes.LoadMessageRecordsSuccess;

  constructor(public payload: {records: any}) {}
}

export class LoadMessageRecordsFailure implements Action {
  readonly type = ActionTypes.LoadMessageRecordsFailure;

  constructor(public payload: {error: any}) {}
}

export type ActionsUnion = LoadMessageRecordsBegin | LoadMessageRecordsSuccess | LoadMessageRecordsFailure;