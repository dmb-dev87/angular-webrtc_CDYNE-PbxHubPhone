import {AfterViewInit, Component, OnInit} from '@angular/core';
import { environment } from '../../../environments/environment';
import {getButtons, addInputValue, getInputValue, getAudio, getVideo, getButton} from '../../utilities/ui-utils';
import {WebUser, WebUserDelegate, WebUserOptions} from '../../utilities/webphone/web-user';


const authName = `9FE12102-FAB4-4524-ACF4-641F247145E7`;
const authPassword = `E3F2D`;

// const authName = `F26D43A5-6D69-443A-AFF3-BB19D35C52CF`;
// const authPassword = `62AC9`;

@Component({
  selector: 'app-phone-panel',
  templateUrl: './phone-panel.component.html',
  styleUrls: ['./phone-panel.component.scss']
})



export class PhonePanelComponent implements OnInit, AfterViewInit {
  private webSocketServer = environment.socketServer;
  private hostURL = environment.hostURL;
  private webUser = null;

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
    const audioElement = getAudio(`remoteAudio`);
    const videoElement = getVideo(`localVideo`);



    console.log(`+++++++++++++++++++++++++=`, audioElement);
    const webUserOptions: WebUserOptions = {
      media: {
        constraints: {
          audio: true,
          video: false
        },
        local: {
          video: videoElement
        },
        remote: {
          audio: audioElement
        }
      },
      userAgentOptions: {
        authorizationPassword: authPassword,
        authorizationUsername: authName,
        forceRport: true,
        contactName: `Bojan`,
      },
      aor: `sip:2001@${this.hostURL}`
    }

    this.webUser = new WebUser(this.webSocketServer, webUserOptions);

    const delegate: WebUserDelegate = {
      onCallCreated: this.makeCallCreatedCallback(this.webUser),
      onCallReceived: this.makeCallReceivedCallback(this.webUser),
      onCallHangup: this.makeCallHangupCallback(this.webUser)
      // onRegistered: makeRegisteredCallback(user, registerButton, unregisterButton),
      // onUnregistered: makeUnregisteredCallback(user, registerButton, unregisterButton),
      // onServerConnect: makeServerConnectCallback(user, connectButton, disconnectButton, registerButton, beginButton),
      // onServerDisconnect: makeServerDisconnectCallback(user, connectButton, disconnectButton, registerButton, beginButton)
    };

    this.webUser.delegate = delegate;

    this.webUser
      .connect()
      .then(() => {
        // this.webUser.register(undefined);
        console.log(`++++++++++++++++++++ Successed to connect`);
        this.register();
      })
      .catch((error: Error) => {
        console.error(`Failed to connect`);
        console.error(error);
        alert(`Failed to connect.\n` + error);
      });
  }

  register(): void {
    this.webUser
      .register(undefined)
      .then(() => {
        console.log(`++++++++++++++++++ Register success`, this.webUser.registerer.registered);
      })
      .catch((error: Error) => {
        console.error(`[${this.webUser.id}] failed to register`);
        console.error(error);
        alert(`[${this.webUser.id}] Failed to register.\n` + error);
      });
  }

  makeCall(): void {
    const targetNum = getInputValue(`call-number`);

    console.log(`+++++++++++++++++++++++++`, this.webUser.registered);

    if (!this.webUser.registerer.registered) {
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

  makeCallCreatedCallback(user: WebUser): () => void {
    return () => {
      console.log(`[${user.id}] call created`);

      const beginButton = getButton(`begin-call`);
      const endButton = getButton(`end-call`);

      beginButton.disabled = true;
      endButton.disabled = false;
    };
  }

  makeCallReceivedCallback(user: WebUser): () => void {
    return () => {
      console.log(`[${user.id}] call received`);
      user.answer().catch((error: Error) => {
        console.error(`[${user.id}] failed to answer call`);
        console.error(error);
        alert(`[${user.id}] Failed to answer call.\n` + error);
      });
    };
  }

  makeCallHangupCallback(user: WebUser): () => void {
    return () => {
      console.log(`[${user.id}] call hangup`);
      const beginButton = getButton(`begin-call`);
      const endButton = getButton(`end-call`);
      beginButton.disabled = !user.isConnected();
      endButton.disabled = true;
    };
  }

}
