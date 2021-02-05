import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { PbxControlService } from '../services/pbxcontrol.service';
import * as PhoneContacsActions from '../actions/phonecontacts.actions';

import * as xml2js from 'xml2js';

@Injectable()

export class PhoneContactsEffects {
  constructor(private actions: Actions, private pbxSoapService: PbxControlService) {}

  @Effect()
  userGetDirecotry = this.actions.pipe(
    ofType(PhoneContacsActions.ActionTypes.LoadPhoneContactsBegin),
    switchMap(() => {
      return this.pbxSoapService.userGetDirecotry().pipe(
        map(data => {
          const items = this.parseXML(data);
          return new PhoneContacsActions.LoadPhoneContactsSuccess({data: items});
        }),
        catchError(error =>
          of(new PhoneContacsActions.LoadPhoneContactsFailer({ error }))
        )
      );
    })
  );

  parseXML(data): any {
    const arr = [];
    const parser = new xml2js.Parser({
      trim: true,
      explicitArray: true
    });
    parser.parseString(data, (err, result) => {
      const envelope = result['s:Envelope'];
      const body = envelope['s:Body'];
      const dirRes = body[0].User_GetDirectoryResponse;
      const dirResult = dirRes[0].User_GetDirectoryResult;
      const aPbxUserList = dirResult[0]['a:PbxUserLite'];
      for(const k in aPbxUserList) {
        const item = aPbxUserList[k];
        arr.push({
          extension: item['a:Extension'][0],
          firstName: item['a:FirstName'][0],
          lastName: item['a:LastName'][0]
        });
      }
    });
    return arr;
  }
}
