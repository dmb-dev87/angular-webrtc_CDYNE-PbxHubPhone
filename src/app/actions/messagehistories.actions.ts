import { Action } from '@ngrx/store';

export enum ActionTypes {
  LoadMessageHistoriesBegin = `[MessageHistories] Load data begin`,
  LoadMessageHistoriesSuccess = `[MessageHistories] Load data success`,
  LoadMessageHistoriesFailure = `[MessageHistories] Load data failure`,
  UpdateMessageHistories = `[MessageHistories] Update data`,
  AddMessageHistory = `[MessageHistories] Add data`,
}

export class LoadMessageHistoriesBegin implements Action {
  readonly type = ActionTypes.LoadMessageHistoriesBegin;

  constructor(public payload: {extension: string, messageId: number}) {}
}

export class LoadMessageHistoriesSuccess implements Action {
  readonly type = ActionTypes.LoadMessageHistoriesSuccess;

  constructor(public payload: {histories: any}) {}
}

export class LoadMessageHistoriesFailure implements Action {
  readonly type = ActionTypes.LoadMessageHistoriesFailure;

  constructor(public payload: {error: any}) {}
}

export class UpdateMessageHistories implements Action {
  readonly type = ActionTypes.UpdateMessageHistories;

  constructor(public payload: {histories: any}) {}
}

export class AddMessageHistory implements Action {
  readonly type = ActionTypes.AddMessageHistory;

  constructor(public payload: {history: any}) {}
}

export type ActionsUnion = LoadMessageHistoriesBegin | LoadMessageHistoriesSuccess | LoadMessageHistoriesFailure 
                          | UpdateMessageHistories | AddMessageHistory;