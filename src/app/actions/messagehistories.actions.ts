import { Action } from '@ngrx/store';
import { PhoneContact } from '../models/phonecontact';

export enum ActionTypes {
  LoadMessageHistoriesBegin = `[MessageHistories] Load data begin`,
  LoadMessageHistoriesSuccess = `[MessageHitories] Load data success`,
  LoadMessageHistoriesFailure = `[MessageHitories] Load data failure`,
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

export type ActionsUnion = LoadMessageHistoriesBegin | LoadMessageHistoriesSuccess | LoadMessageHistoriesFailure;