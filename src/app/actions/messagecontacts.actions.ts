import { Action } from '@ngrx/store';
import { MessageContact } from '../models/messagecontact';
import { AddMessageRecordFailure } from './messagehistories.actions';

export enum ActionTypes {
  LoadMessageContactsBegin = `[MessageContacts] Load data begin`,
  LoadMessageContactsSuccess = `[MessageContacts] Load data success`,
  LoadMessageContactsFailure = `[MessageContacts] Load data failure`,
  DeleteMessageContactBegin = `[MessageContact] Delete data begin`,
  DeleteMessageContactSuccess = `[MessageContact] Delete data succuess`,
  DeleteMessageContactFailure = `[MessageContact] Delete data failure`,
  AddMessageContactBegin = `[MessageContact] Add data begin`,
  AddMessageContactSuccess = `[MessageContact] Add data succuess`,
  AddMessageContactFailure = `[MessageContact] Add data failure`,
}

export class LoadMessageContactsBegin implements Action {
  readonly type = ActionTypes.LoadMessageContactsBegin;
}

export class LoadMessageContactsSuccess implements Action {
  readonly type = ActionTypes.LoadMessageContactsSuccess;

  constructor(public payload: {contacts: any}) {}
}

export class LoadMessageContactsFailure implements Action {
  readonly type = ActionTypes.LoadMessageContactsFailure;

  constructor(public payload: {error: any}) {}
}

export class DeleteMessageContactBegin implements Action {
  readonly type = ActionTypes.DeleteMessageContactBegin;

  constructor(public payload: {contact: MessageContact}) {}
}

export class DeleteMessageContactSuccess implements Action {
  readonly type = ActionTypes.DeleteMessageContactSuccess;

  constructor(public payload: {contacts: any}) {}
}

export class DeleteMessageContactFailure implements Action {
  readonly type = ActionTypes.DeleteMessageContactFailure;

  constructor(public payload: {error: any}) {}
}

export class AddMessageContactBegin implements Action {
  readonly type = ActionTypes.AddMessageContactBegin;

  constructor(public payload: {contact: MessageContact}) {}
}

export class AddMessageContactSuccess implements Action {
  readonly type = ActionTypes.AddMessageContactSuccess;

  constructor(public payload: {contacts: any}) {}
}

export class AddMessageContactFailure implements Action {
  readonly type = ActionTypes.AddMessageContactFailure;

  constructor(public payload: {error: any}) {}
}

export type ActionsUnion = LoadMessageContactsBegin | LoadMessageContactsSuccess | LoadMessageContactsFailure
                          | DeleteMessageContactBegin | DeleteMessageContactSuccess | DeleteMessageContactFailure
                          | AddMessageContactBegin | AddMessageContactSuccess | AddMessageContactFailure;