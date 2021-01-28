import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { PbxsoapService } from '../services/pbxsoap.service';
import * as PhoneContacsActions from '../actions/phonecontacts.actions';
import * as PhoneUserActions from '../actions/phoneuser.actions';

@Injectable()

export class PhoneContactsEffects {
  constructor(private actions: Actions, private pbxSoapService: PbxsoapService) {}

  @Effect()
  loadData = this.actions.pipe(
    ofType(PhoneContacsActions.ActionTypes.LoadPhoneContactsBegin),
    switchMap(() => {
      return this.pbxSoapService.loadData().pipe(
        map(data => new PhoneContacsActions.LoadPhoneContactsSuccess({ data })),
        catchError(error =>
          of(new PhoneContacsActions.LoadPhoneContactsFailer({ error }))
        )
      );
    })
  );
}
