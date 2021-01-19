import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SimpleUser, SimpleUserDelegate, SimpleUserOptions } from 'sip.js/lib/platform/web';
import { UserAgent, UserAgentOptions, Registerer } from 'sip.js';

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
  }

  connectToServer(): void {
    const transportOptions = {
      server: this.webSocketServer
    };

    const uri = UserAgent.makeURI(`sip:orfpbx3.cdyne.net:1443`);

    console.log("++++++++++++++++++", uri);

    const userAgentOptions: UserAgentOptions = {
      authorizationPassword: authPassword,
      authorizationUsername: authName,
      transportOptions,
      uri
    };

    this.userAgent = new UserAgent(userAgentOptions);

    this.registerer = new Registerer(this.userAgent);

    console.log(`+++++++++++++++++`, this.registerer);

    this.userAgent.start()
      .then(() => {
        console.log(`++++++++++++++++++++++++ Successed to connect`);
        this.registerer.register();
      })
      .catch((error: Error) => {
        console.error(`Failed to connect`);
        console.error(error);
        alert(`Failed to connect.\n` + error);
      });
  }

}
