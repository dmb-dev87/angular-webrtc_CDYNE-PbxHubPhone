import { NgModule } from '@angular/core';

import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    MatRadioModule,
    MatSliderModule,
    MatProgressBarModule,
    MatIconModule
  ],
  exports: [
    MatRadioModule,
    MatSliderModule,
    MatProgressBarModule,
    MatIconModule
  ]
})
export class MaterialModule {}
