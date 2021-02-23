import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-misc-control',
  templateUrl: './misc-control.component.html',
  styleUrls: ['./misc-control.component.scss']
})
export class MiscControlComponent implements OnInit {

  @Output() transfer = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  onMakeTransfer(): void {
    this.transfer.emit();
  }

}
