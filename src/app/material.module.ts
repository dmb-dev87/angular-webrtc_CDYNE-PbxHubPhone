import { NgModule } from '@angular/core';

import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@NgModule({
  imports: [
    MatRadioModule,
    MatSliderModule,
    MatProgressBarModule
  ],
  exports: [
    MatRadioModule,
    MatSliderModule,
    MatProgressBarModule
  ]
})
export class MaterialModule {}
