import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { PhoneUserService } from '../services/phoneuser.service';
import * as PhoneUserActions from '../actions/phoneuser.actions';

@Injectable()

export class PhoneUserEffects {
  constructor(private actions: Actions, private phoneUserService: PhoneUserService) {}

  @Effect()
  loadData = this.actions.pipe(
    ofType(PhoneUserActions.ActionTypes.LoadPhoneUserBegin),
    switchMap(() => {
      return this.phoneUserService.loadData().pipe(
        map(data => new PhoneUserActions.LoadPhoneUserSuccess({ data })),
        catchError(error =>
          of(new PhoneUserActions.LoadPhoneUserFailure({ error }))
        )
      );
    })
  );
}
