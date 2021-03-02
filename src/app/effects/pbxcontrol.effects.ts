import { Injectable } from '@angular/core';
import { act, Actions, Effect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { PbxControlService } from '../services/pbxcontrol.service';

import * as PhoneContacsActions from '../actions/phonecontacts.actions';
import * as PhoneUserActions from '../actions/phoneuser.actions';
import * as MessageHistoriesActions from '../actions/messagehistories.actions';
import * as MessageContactsActions from '../actions/messagecontacts.actions';

import { parseContact, parseWebRtcDemo, parseMessageContact, parseMessageHistories } from '../utilities/parse-utils';

@Injectable()

export class PbxControlEffects {
  constructor(private actions: Actions, private pbxControlService: PbxControlService) {}

  @Effect()
  userGetDirecotry = this.actions.pipe(
    ofType(PhoneContacsActions.ActionTypes.LoadPhoneContactsBegin),
    switchMap(() => {
      return this.pbxControlService.userGetDirecotry().pipe(
        map(data => {
          const items = parseContact(data);
          return new PhoneContacsActions.LoadPhoneContactsSuccess({data: items});
        }),
        catchError(error =>
          of(new PhoneContacsActions.LoadPhoneContactsFailer({ error }))
        )
      );
    })
  );

  @Effect()
  webRtcDemo = this.actions.pipe(
    ofType(PhoneUserActions.ActionTypes.LoadPhoneUserBegin),
    switchMap((action: PhoneUserActions.LoadPhoneUserBegin) => {
      return this.pbxControlService.webRtcDemo(action.email).pipe(
        map(data => {
          const phoneUser = parseWebRtcDemo(data);
          return new PhoneUserActions.LoadPhoneUserSuccess({data: phoneUser});
        }),
        catchError(error =>
          of(new PhoneUserActions.LoadPhoneUserFailure({ error }))
        )
      );
    })
  );

  @Effect()
  messageGetActiveConversations = this.actions.pipe(
    ofType(MessageContactsActions.ActionTypes.LoadMessageContactsBegin),
    switchMap(() => {
      return this.pbxControlService.messageGetActiveConversations().pipe(
        map(data => {
          const items = parseMessageContact(data);
          return new MessageContactsActions.LoadMessageContactsSuccess({contacts: items});
        }),
        catchError(error =>
          of(new MessageContactsActions.LoadMessageContactsFailure({ error }))
        )
      );
    })
  );

  @Effect()
  messageHideConversation = this.actions.pipe(
    ofType(MessageContactsActions.ActionTypes.DeleteMessageContactBegin),
    switchMap((action: MessageContactsActions.DeleteMessageContactBegin) => {
      return this.pbxControlService.messageHideConversation(action.payload.contact).pipe(
        map(data => {
          return new MessageContactsActions.DeleteMessageContactSuccess({contact: action.payload});
        }),
        catchError(error => 
          of(new MessageContactsActions.DeleteMessageContactFailure({ error }))
        )
      );
    })
  );

  @Effect()
  messageActivateConversation = this.actions.pipe(
    ofType(MessageContactsActions.ActionTypes.AddMessageContactBegin),
    switchMap((action: MessageContactsActions.AddMessageContactBegin) => {
      return this.pbxControlService.messageActivateConversation(action.payload.contact).pipe(
        map(data => {
          return new MessageContactsActions.AddMessageContactSuccess({contact: action.payload});
        }),
        catchError(error =>
          of(new MessageContactsActions.AddMessageContactFailure({ error }))
        )
      );
    })
  );

  @Effect()
  messageGetMessages = this.actions.pipe(
    ofType(MessageHistoriesActions.ActionTypes.LoadMessageHistoriesBegin),
    switchMap((action: MessageHistoriesActions.LoadMessageHistoriesBegin) => {
      return this.pbxControlService.messageGetMessages(action.payload).pipe(
        map(data => {
          const histories = parseMessageHistories(data);
          return new MessageHistoriesActions.LoadMessageHistoriesSuccess({histories: histories});
        }),
        catchError(error =>
          of(new MessageHistoriesActions.LoadMessageHistoriesFailure({ error }))
        )
      );
    })
  );

  // @Effect()
  // getHistories = this.actions.pipe(
  //   ofType(MessageHistoriesActions.ActionTypes.LoadMessageHistoriesBegin),
  //   switchMap((action: MessageHistoriesActions.LoadMessageHistoriesBegin) => (this.pbxControlService.getHistories(action.payload.messageContacts))),
  //   map(data => new MessageHistoriesActions.LoadMessageHistoriesSuccess({histories: data})),
  //   catchError(error => of(new MessageHistoriesActions.LoadMessageHistoriesFailure({ error })))
  // );

  // @Effect()
  // addMessageRecord = this.actions.pipe(
  //   ofType(MessageHistoriesActions.ActionTypes.AddMessageRecordBegin),
  //   switchMap((action: MessageHistoriesActions.AddMessageRecordBegin) => (this.pbxControlService.addMessageRecordToHistory(action.payload))),
  //   map(data => new MessageHistoriesActions.AddMessageRecordSuccess({histories: data})),
  //   catchError(error => of(new MessageHistoriesActions.AddMessageRecordFailure({error})))
  // );

  // @Effect()
  // messageGetActiveConversations = this.actions.pipe(
  //   ofType(MessageContactsActions.ActionTypes.LoadMessageContactsBegin),
  //   switchMap(() => {
  //     return this.pbxControlService.messageGetActiveConversations().pipe(
  //       map(data => {
  //         const items = parseMessageContact(data);
  //         return new MessageContactsActions.LoadMessageContactsSuccess({contacts: items});
  //       }),
  //       catchError(error =>
  //         of(new MessageContactsActions.LoadMessageContactsFailure({ error }))
  //       )
  //     );
  //   })
  // );

  // @Effect()
  // messageHideConversation = this.actions.pipe(
  //   ofType(MessageContactsActions.ActionTypes.DeleteMessageContactBegin),
  //   switchMap((action: MessageContactsActions.DeleteMessageContactBegin) => (this.pbxControlService.messageHideConversation(action.payload.contact))),
  //   map(data => new MessageContactsActions.DeleteMessageContactSuccess({contacts: data})),
  //   catchError(error => of(new MessageContactsActions.DeleteMessageContactFailure({error})))
  // );

  // @Effect()
  // messageActivateConversation = this.actions.pipe(
  //   ofType(MessageContactsActions.ActionTypes.AddMessageContactBegin),
  //   switchMap((action: MessageContactsActions.AddMessageContactBegin) => (this.pbxControlService.messageActivateConversation(action.payload.contact))),
  //   map(data => new MessageContactsActions.AddMessageContactSuccess({contacts: data})),
  //   catchError(error => of(new MessageContactsActions.AddMessageContactFailure({error})))
  // );

  // @Effect()
  // addMessageHistoryToState = this.actions.pipe(
  //   ofType(MessageHistoriesActions.ActionTypes.AddMessageHistoryBegin),
  //   switchMap((action: MessageHistoriesActions.AddMessageHistoryBegin) => (this.pbxControlService.addMessageHistoryToState(action.payload.messageContact))),
  //   map(data => new MessageHistoriesActions.AddMessageHistorySuccess({histories: data})),
  //   catchError(error => of(new MessageHistoriesActions.AddMessageHistoryFailure({error})))
  // )

  // @Effect()
  // deleteMessageHistoryFromState = this.actions.pipe(
  //   ofType(MessageHistoriesActions.ActionTypes.DeleteMessageHistoryBegin),
  //   switchMap((action: MessageHistoriesActions.DeleteMessageHistoryBegin) => (this.pbxControlService.deleteMessageHistoryFromState(action.payload.messageContact))),
  //   map(data => new MessageHistoriesActions.DeleteMessageHistorySuccess({histories: data})),
  //   catchError(error => of(new MessageHistoriesActions.DeleteMessageHistoryFailure({error})))
  // )
}
