import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { getButtons, addInputValue, getInputValue } from '../../utilities/ui-utils';
import { UserAgent, UserAgentOptions, Registerer, Inviter } from 'sip.js';


const authName = `9FE12102-FAB4-4524-ACF4-641F247145E7`;
const authPassword = `E3F2D`;

@Component({
  selector: 'app-phone-panel',
  templateUrl: './phone-panel.component.html',
  styleUrls: ['./phone-panel.component.scss']
})

export class PhonePanelComponent implements OnInit {
  private webSocketServer = environment.socketServer;
  private serverURL = environment.serverURL;
  private userAgent = null;
  private registerer = null;

  constructor() {
    this.connectToServer();
  }

  ngOnInit(): void {
    const keypad = getButtons(`btn-number`);

    keypad.forEach((button) => {
      button.addEventListener(`click`, () => {
        const toneNum = button.textContent;
        if (toneNum) {
          addInputValue(`call-number`, toneNum);
        }
      });
    });
  }

  connectToServer(): void {
    const transportOptions = {
      server: this.webSocketServer
    };

    // const uri = UserAgent.makeURI(`sip:orfpbx3.cdyne.net:1443`);
    const uri = UserAgent.makeURI(`sip:alice@${this.serverURL}`)

    console.log(`++++++++++++++++++`, uri);

    const userAgentOptions: UserAgentOptions = {
      authorizationPassword: authPassword,
      authorizationUsername: authName,
      transportOptions,
      uri
    };

    this.userAgent = new UserAgent(userAgentOptions);

    this.registerer = new Registerer(this.userAgent);

    console.log(`+++++++++++++++++`, this.registerer);
  }

  makeCall(): void {
    const targetNum = getInputValue(`call-number`);
    this.userAgent.start()
      .then(() => {
        console.log(`++++++++++++++++++++++++++ Successed to connect`);

        const target = UserAgent.makeURI(`sip:${targetNum}@${this.serverURL}`);

        console.log(`++++++++++++++++++`, target);

        const inviter = new Inviter(this.userAgent, target);
        inviter.invite();
      })
      .catch((error: Error) => {
        console.error(`Failed to connect`);
        console.error(error);
        alert(`Failed to connect.\n` + error);
      });
  }

}
