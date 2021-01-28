import { AfterViewInit, Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { addInputValue, getInputValue, getAudio, getVideo, getButton } from '../../utilities/ui-utils';
import { WebUser, WebUserDelegate, WebUserOptions } from '../../utilities/webphone';
import { PhoneUser } from '../../models/phoneuser';
import { PhoneUserService} from '../../services/phoneuser.service';
import { PbxsoapService } from '../../services/pbxsoap.service';

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

  private beginButton = null;
  private endButton = null;
  private muteButton = null;
  private holdButton = null;

  constructor(private phoneUserService: PhoneUserService, private pbxSoapService: PbxsoapService) {
    this.phoneUserService.load();
    this.pbxSoapService.load();
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
        // set username to localstorage
        localStorage.setItem(`user_name`, this._phoneUser.authName);
        this.connectToServer();
      }
    });

    this.beginButton = getButton(`begin-call`);
    this.endButton = getButton(`end-call`);
    this.muteButton = getButton(`mute-btn`);
    this.holdButton = getButton(`hold-btn`);

    this.beginButton.disabled = true;
    this.endButton.disabled = true;
    this.muteButton.disabled = true;
    this.holdButton.disabled = true;
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
      onCallReceived: (callerId: string): void => this.makeCallReceivedCallback(callerId),
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

    this.beginButton.disabled = false;
    this.endButton.disabled = true;
    this.muteButton.disabled = true;
    this.holdButton.disabled = true;
  }

  clickCall(): void {
    if (!this.webUser.registerer.registered) {
      console.error(`Failed to call, have to register`);
      this.webUser.register(undefined);
    }

    this.beginButton.disabled = true;
    this.endButton.disabled = false;
    this.muteButton.disabled = false;
    this.holdButton.disabled = false;

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
      const targetNum = getInputValue(`call-number`);
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
    this.beginButton.disabled = true;
    this.endButton.disabled = true;
    this.muteButton.disabled = true;
    this.holdButton.disabled = true;

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

      this.beginButton.disabled = true;
      this.endButton.disabled = false;
      this.muteButton.disabled = false;
      this.holdButton.disabled = false;
    };
  }

  makeCallReceivedCallback(callerId: string): void {
    console.log(`+++++++++++++++++++++++++++`, callerId);
    this.callerId = callerId;

    this.beginButton.disabled = false;
    this.endButton.disabled = false;
    this.muteButton.disabled = false;
    this.holdButton.disabled = false;

    this.invitationState = true;

    ringAudio.loop = true;
    ringAudio.autoplay = true;
    ringAudio.play();
  }

  makeCallHangupCallback(user: WebUser): () => void {
    return () => {
      console.log(`[${user.id}] call hangup`);

      this.beginButton.disabled = !user.isConnected();
      this.endButton.disabled = false;
      this.muteButton.disabled = false;
      this.holdButton.disabled = false;
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
    };
  }

  makeServerDisconnectCallback(user: WebUser): () => void {
    return (err?: Error) => {
      console.log(`[${user.id}] disconnected`);
      if (err) {
        alert(`[${user.id}] Server disconnected.\n` + err.message);
      }
    };
  }
}
