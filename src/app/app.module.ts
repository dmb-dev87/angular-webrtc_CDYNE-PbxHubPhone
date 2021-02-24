import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StoreModule } from '@ngrx/store';
import { HttpClientModule } from '@angular/common/http';
import { EffectsModule } from '@ngrx/effects';
import { reducers, metaReducers } from './reducers';
import { effects } from './effects';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from './material.module';
import { ClickOutsideModule } from 'ng-click-outside';

import { PhonePanelComponent } from './components/phone-panel/phone-panel.component';
import { WebPhoneComponent } from './components/web-phone/web-phone.component';
import { LineInfoComponent } from './components/line-info/line-info.component';
import { PhoneControlComponent } from './components/phone-control/phone-control.component';
import { UserInfoComponent } from './components/user-info/user-info.component';
import { DialPadComponent } from './components/dial-pad/dial-pad.component';
import { MiscControlComponent } from './components/misc-control/misc-control.component';

@NgModule({
  declarations: [
    AppComponent,
    PhonePanelComponent,
    WebPhoneComponent,
    LineInfoComponent,
    PhoneControlComponent,
    UserInfoComponent,
    DialPadComponent,
    MiscControlComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    StoreModule.forRoot(reducers, { metaReducers }),
    EffectsModule.forRoot(effects),
    BrowserAnimationsModule,
    FormsModule,
    MaterialModule,
    ClickOutsideModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
