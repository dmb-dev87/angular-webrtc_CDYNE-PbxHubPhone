import { Action } from '@ngrx/store';

export enum ActionTypes {
  UpdateCallerId = `[PhoneStatus] Set Caller Id`,
  UpdateCallStatus = `[PhoneStatus] Set Call Status`
}

export class UpdateCallerId implements Action {
  readonly type = ActionTypes.UpdateCallerId;

  constructor(public callerId: string) {}
}

export class UpdateCallStatus implements Action {
  readonly type = ActionTypes.UpdateCallStatus;

  constructor(public callStatus: string) {}
}

export type ActionsUnion = UpdateCallerId | UpdateCallStatus;
