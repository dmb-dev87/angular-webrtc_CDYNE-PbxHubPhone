import { AfterViewInit, Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { addInputValue, getInputValue, getAudio, getVideo, getButton } from '../../utilities/ui-utils';
import { WebUser, WebUserDelegate, WebUserOptions } from '../../utilities/webphone';
import { PhoneUser } from '../../models/phoneuser';
import { PhoneUserService} from '../../services/phoneuser.service';

const ringAudio = new Audio(`assets/sound/ring.mp3`);
const webSocketServer = environment.socketServer;
const hostURL = environment.hostURL;

@Component({
  selector: 'app-phone-panel',
  templateUrl: './phone-panel.component.html',
  styleUrls: ['./phone-panel.component.scss']
})

export class PhonePanelComponent implements OnInit, AfterViewInit {
  callerId = null;
  numberBtnToggle = false;
  muteToggle = false;
  holdToggle = false;

  private webUser = null;
  private invitationState = null;
  private _phoneUser: PhoneUser = undefined;

  constructor(private phoneUserService: PhoneUserService) {
    this.phoneUserService.load();
  }

  get phoneUser(): PhoneUser {
    return this._phoneUser;
  }

  set phoneUser(phoneUser: PhoneUser | undefined) {
    this._phoneUser = phoneUser;
  }

  ngOnInit(): void {
    this.numberBtnToggle = false;
  }

  ngAfterViewInit(): void {
    const numberToggle = getButton(`number-toggle`);
    numberToggle.addEventListener(`click`, () => {
      this.numberBtnToggle = !this.numberBtnToggle;
    })

    this.phoneUserService.getPhoneUser().subscribe(phoneuser => {
      this._phoneUser = phoneuser.data;
      if (this._phoneUser) {
        this.connectToServer();
      }
    });
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
        authorizationPassword: this.phoneUser.authPassword,
        authorizationUsername: this.phoneUser.authName,
        forceRport: true,
        contactName: this.phoneUser.displayName,
      },
      aor: `sip:${this.phoneUser.extenNumber}@${hostURL}`
    }

    this.webUser = new WebUser(webSocketServer, webUserOptions);

    // const delegate: SimpleUserDelegate = {
    const delegate: WebUserDelegate = {
      onCallCreated: this.makeCallCreatedCallback(this.webUser),
      onCallReceived: this.makeCallReceivedCallback,
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
      .catch((error: Error) => {
        console.error(`[${this.webUser.id}] failed to register`);
        console.error(error);
        alert(`[${this.webUser.id}] Failed to register.\n` + error);
      });
  }

  clickNumber(toneNum: string): void {
    addInputValue(`call-number`, toneNum);
  }

  clickCall(): void {
    const targetNum = getInputValue(`call-number`);

    if (!this.webUser.registerer.registered) {
      console.error(`Failed to call, have to register`);
      this.webUser.register(undefined);
    }

    if (this.invitationState === true) {
      ringAudio.pause();
      ringAudio.currentTime = 0;
      this.invitationState = false;
      this.webUser
        .answer(undefined)
        .catch( (err: Error) => {
          console.error(`[${this.webUser.id}] failed to answer call`);
          console.error(err);
          alert(`[${this.webUser.id}] Failed to answer call.\n` + err);
        });
    } else {
      const target = `sip:${targetNum}@${hostURL}`;
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
        .catch((err: Error) => {
          console.error(`Failed to place call`);
          console.error(err);
          alert(`Failed to place call.\n` + err);
        });
    }
  }

  hangupCall(): void {
    if (this.invitationState === true) {
      ringAudio.pause();
      ringAudio.currentTime = 0;
      this.invitationState = false;
      this.webUser
        .decline()
        .catch((err: Error) => {
          console.error(`[${this.webUser.id}] failed to decline call`);
          console.error(err);
          alert(`[${this.webUser.id}] Failed to decline call.\n` + err);
        });
    } else {
      this.webUser.hangup().catch((err: Error) => {
        console.error(`Failed to hangup call`);
        console.error(err);
        alert(`Failed to hangup call.\n` + err);
      });
    }
  }

  onMute(): void {
    this.muteToggle = !this.muteToggle;
    if (this.muteToggle) {
      this.webUser.mute();
      if (this.webUser.isMuted() === false) {
        this.muteToggle = false;
        console.error(`[${this.webUser.id}] failed to mute call`);
        alert(`Failed to mute call.\n`);
      }
    } else {
      this.webUser.unmute();
      if (this.webUser.isMuted() === true) {
        this.muteToggle = true;
        console.error(`[${this.webUser.id}] failed to unmute call`);
        alert(`Failed to unmute call.\n`);
      }
    }
  }

  onHold(): void {
    this.holdToggle = !this.holdToggle;
    if (this.holdToggle) {
      this.webUser.hold().catch((error: Error) => {
        this.holdToggle = false;
        console.error(`[${this.webUser.id}] failed to hold call`);
        console.error(error);
        alert(`Failed to hold call.\n` + error);
      });
    } else {
      this.webUser.unhold().catch((error: Error) => {
        this.holdToggle = true;
        console.error(`[${this.webUser.id}] failed to unhold call`);
        console.error(error);
        alert(`Failed to unhold call.\n` + error);
      });
    }
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

  makeCallReceivedCallback(callerId: string): void {
    this.callerId = callerId;

    const beginButton = getButton(`begin-call`);
    const endButton = getButton(`end-call`);

    beginButton.disabled = false;
    endButton.disabled = false;

    this.invitationState = true;

    ringAudio.loop = true;
    ringAudio.autoplay = true;
    ringAudio.play();
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
    return (err?: Error) => {
      console.log(`[${user.id}] disconnected`);
      const beginButton = getButton(`begin-call`);
      beginButton.disabled = true;
      if (err) {
        alert(`[${user.id}] Server disconnected.\n` + err.message);
      }
    };
  }
}
