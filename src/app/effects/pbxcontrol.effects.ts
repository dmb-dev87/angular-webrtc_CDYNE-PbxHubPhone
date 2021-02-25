import { Injectable } from '@angular/core';
import { act, Actions, Effect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { PbxControlService } from '../services/pbxcontrol.service';
import * as PhoneContacsActions from '../actions/phonecontacts.actions';
import * as PhoneUserActions from '../actions/phoneuser.actions';
import * as MessageHistoriesActions from '../actions/messagehistories.actions';
import * as MessageRecordsActions from '../actions/messagerecords.actions';

import { parseContact, parseMessageRecords, parseWebRtcDemo } from '../utilities/parse-utils';

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
  getHistories = this.actions.pipe(
    ofType(MessageHistoriesActions.ActionTypes.LoadMessageHistoriesBegin),
    switchMap((action: MessageHistoriesActions.LoadMessageHistoriesBegin) => (this.pbxControlService.getHistories(action.phoneContacts))),
    map(data => new MessageHistoriesActions.LoadMessageHistoriesSuccess({histories: data})),
    catchError(error => of(new MessageHistoriesActions.LoadMessageHistoriesFailure({ error })))
  );

  @Effect()
  getRecords = this.actions.pipe(
    ofType(MessageRecordsActions.ActionTypes.LoadMessageRecordsBegin),
    switchMap((action: MessageRecordsActions.LoadMessageRecordsBegin) => {
      return this.pbxControlService.getRecords(action.extension).pipe(
        map(data => {
          const records = parseMessageRecords(data);
          console.log(`+++++++++++++++++++++++++++`, records);
          return new MessageRecordsActions.LoadMessageRecordsSuccess({records: records});
        }),
        catchError(error =>
          of(new MessageRecordsActions.LoadMessageRecordsFailure({ error }))
        )
      );
    })
  );
}
