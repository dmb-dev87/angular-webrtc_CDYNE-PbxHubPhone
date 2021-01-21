import {AfterViewInit, Component, OnInit} from '@angular/core';
import { environment } from '../../../environments/environment';
import { getButtons, addInputValue, getInputValue, getAudio, getVideo, getButton } from '../../utilities/ui-utils';
import { WebUser, WebUserDelegate, WebUserOptions } from '../../utilities/webphone';

const authName = `9FE12102-FAB4-4524-ACF4-641F247145E7`;
const authPassword = `E3F2D`;
const extenNumber = `2001`;
const displayName = `Bojan`;

// const authName = `F26D43A5-6D69-443A-AFF3-BB19D35C52CF`;
// const authPassword = `62AC9`;
// const extenNumber = `2004`;
// const displayName = `Dojan`;

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
        contactName: displayName,
      },
      aor: `sip:${extenNumber}@${this.hostURL}`
    }

    this.webUser = new WebUser(this.webSocketServer, webUserOptions);

    // const delegate: SimpleUserDelegate = {
    const delegate: WebUserDelegate = {
      onCallCreated: this.makeCallCreatedCallback(this.webUser),
      onCallReceived: this.makeCallReceivedCallback(this.webUser),
      onCallHangup: this.makeCallHangupCallback(this.webUser),
      onRegistered: this.makeRegisteredCallback(this.webUser),
      onUnregistered: this.makeUnregisteredCallback(this.webUser),
      onServerConnect: this.makeServerConnectCallback(this.webUser),
      onServerDisconnect: this.makeServerDisconnectCallback(this.webUser)
    };

    this.webUser.delegate = delegate;

    this.webUser
      .connect()
      .then(() => {
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

    this.webUser
      .call(target, undefined, {
        requestDelegate: {
          onReject: (response) => {
            console.warn(`[${this.webUser.id}] INVITE rejected`);
            let message = `Session invitation to "${targetNum}" rejected.\n`;
            message += `Reason: ${response.message.reasonPhrase}\n`;
            message += `Perhaps "${targetNum}" is not connected or registered?\n`;
            message += `Or perhaps "${targetNum}" did not grant access to video?\n`;
            alert(message);
          }
        }
      })
      .catch((error: Error) => {
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
      endButton.disabled = false;
    };
  }

  makeRegisteredCallback(user: WebUser): () => void {
    return () => {
      console.log(`[${user.id}] registered`);
    };
  }

  makeUnregisteredCallback(user: WebUser): () => void {
    return () => {
      console.log(`[${user.id}] unregistered`);
    };
  }

  makeServerConnectCallback(user: WebUser): () => void {
    return () => {
      console.log(`[${user.id}] connected`);
      const beginButton = getButton(`begin-call`);
      beginButton.disabled = false;
    };
  }

  makeServerDisconnectCallback(user: WebUser): () => void {
    return (error?: Error) => {
      console.log(`[${user.id}] disconnected`);
      const beginButton = getButton(`begin-call`);
      beginButton.disabled = true;
      if (error) {
        alert(`[${user.id}] Server disconnected.\n` + error.message);
      }
    };
  }

}
