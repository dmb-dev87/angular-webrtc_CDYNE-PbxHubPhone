import {AfterViewInit, Component, OnInit} from '@angular/core';
import { environment } from '../../../environments/environment';
import { getButtons, addInputValue, getInputValue } from '../../utilities/ui-utils';
import {WebUser, WebUserDelegate, WebUserOptions} from '../../utilities/webphone/web-user';


const authName = `9FE12102-FAB4-4524-ACF4-641F247145E7`;
const authPassword = `E3F2D`;

@Component({
  selector: 'app-phone-panel',
  templateUrl: './phone-panel.component.html',
  styleUrls: ['./phone-panel.component.scss']
})

export class PhonePanelComponent implements OnInit, AfterViewInit {
  private webSocketServer = environment.socketServer;
  private hostURL = environment.hostURL;
  private webUser = null;
  private session = null;

  constructor() {

  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    const keypad = getButtons(`btn-number`);
    keypad.forEach((button) => {
      button.addEventListener(`click`, () => {
        const toneNum = button.textContent;
        if (toneNum) {
          addInputValue(`call-number`, toneNum);
        }
      });
    });

    this.connectToServer();
  }

  connectToServer(): void {
    const webUserOptions: WebUserOptions = {
      userAgentOptions: {
        authorizationPassword: authPassword,
        authorizationUsername: authName,
        forceRport: true,
        contactName: `Bojan`,
      },
      aor: `sip:2001@${this.hostURL}`
    }

    this.webUser = new WebUser(this.webSocketServer, webUserOptions);
    // this.registerer = new Registerer(this.userAgent);

    this.webUser
      .connect()
      .then(() => {
        this.webUser.register(undefined);
        console.log(`++++++++++++++++++++ Successed to connect`);
        // this.registerer.register();
      })
      .catch((error: Error) => {
        console.error(`Failed to connect`);
        console.error(error);
        alert(`Failed to connect.\n` + error);
      });
  }

  makeCall(): void {
    const targetNum = getInputValue(`call-number`);

    if (!this.webUser.registered) {
      console.error(`Failed to call, have to register`);
      this.webUser.register(undefined);
    }

    const target = `sip:${targetNum}@${this.hostURL}`;

    this.webUser.call(target).catch((error: Error) => {
      console.error(`Failed to place call`);
      console.error(error);
      alert(`Failed to place call.\n` + error);
    });
  }

  hangupCall(): void {
    this.webUser.hangup().catch((error: Error) => {
      console.error(`Failed to hangup call`);
      console.error(error);
      alert(`Failed to hangup call.\n` + error);
    });
  }

}
