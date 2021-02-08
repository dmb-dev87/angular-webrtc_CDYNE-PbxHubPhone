import { AfterViewInit, Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { addInputValue, getInputValue, setInputValue, getAudio, getVideo, getButton, setButtonText, getButtonText } from '../../utilities/ui-utils';
import { EndUser, EndUserOptions, EndUserDelegate } from '../../utilities/platform/web/end-user';
import { PhoneUser } from '../../models/phoneuser';
import { PhoneContact } from '../../models/phonecontact';
import { PhoneUserService} from '../../services/phoneuser.service';
import { DndState, PbxControlService } from '../../services/pbxcontrol.service';

const ringAudio = new Audio(`assets/sound/ring.mp3`);
const webSocketServer = environment.socketServer;
const hostURL = environment.hostURL;
const userAgent = environment.userAgent;

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
  dndToggle = false;
  searchResult = [];
  selectLine = `1`;
  transferState = false;
  lineChanged = false;

  private endUser = null;
  private callState = false;
  private invitationState = false;
  private _phoneUser: PhoneUser = undefined;
  private _phoneContacts: Array<PhoneContact> = [];

  private beginButton = null;
  private endButton = null;
  private muteButton = null;
  private holdButton = null;

  constructor(private phoneUserService: PhoneUserService, private pbxControlService: PbxControlService) {
    this.phoneUserService.load();
    this.pbxControlService.load();
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
    });

    this.phoneUserService.getPhoneUser().subscribe(phoneuser => {
      this._phoneUser = phoneuser.data;
      if (this._phoneUser) {
        // set username to localstorage
        localStorage.setItem(`user_name`, this._phoneUser.authName);
        this.connectToServer();
      }
    });

    this.pbxControlService.getPhoneContacts().subscribe(phonecontacts => {
      this._phoneContacts = phonecontacts.data;
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
    const endUserOptions: EndUserOptions = {
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
        userAgentString: userAgent,
      },
      aor: `sip:${this.phoneUser.extenNumber}@${hostURL}`
    };

    this.endUser = new EndUser(webSocketServer, endUserOptions);

    const delegate: EndUserDelegate = {
      onCallCreated: this.makeCallCreatedCallback(this.endUser),
      onCallReceived: (callerId: string): void => this.makeCallReceivedCallback(callerId),
      onCallHangup: this.makeCallHangupCallback(this.endUser),
      onRegistered: this.makeRegisteredCallback(this.endUser),
      onUnregistered: this.makeUnregisteredCallback(this.endUser),
      onServerConnect: this.makeServerConnectCallback(this.endUser),
      onServerDisconnect: this.makeServerDisconnectCallback(this.endUser),
    };

    this.endUser.delegate = delegate;

    this.endUser
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
    this.endUser
      .register(undefined)
      .catch((error: Error) => {
        console.error(`[${this.endUser.id}] failed to register`);
        console.error(error);
        alert(`[${this.endUser.id}] Failed to register.\n` + error);
      });
  }

  clickNumber(toneNum: string): void {
    if (this.callState === false || this.lineChanged === true || this.transferState === true) {
      addInputValue(`call-number`, toneNum);

      this.beginButton.disabled = false;
      this.endButton.disabled = true;
      this.muteButton.disabled = true;
      this.holdButton.disabled = true;
    }
    else {
      this.beginButton.disabled = false;
      this.endButton.disabled = true;
      this.muteButton.disabled = true;
      this.holdButton.disabled = true;

      this.endUser.sendDTMF(toneNum)
        .then(() => {
          addInputValue(`call-number`, toneNum);
        });
    }
  }

  async makeCall(): Promise<void> {
    if (!this.endUser.registerer.registered) {
      console.error(`Failed to call, have to register`);
      this.endUser.register(undefined);
    }

    this.beginButton.disabled = true;
    this.endButton.disabled = false;
    this.muteButton.disabled = false;
    this.holdButton.disabled = false;

    this.callState = true;

    this.numberBtnToggle = false;

    if (this.invitationState === true) {
      ringAudio.pause();
      ringAudio.currentTime = 0;
      this.invitationState = false;
      this.endUser
        .answer(undefined)
        .catch( (err: Error) => {
          this.callState = true;
          console.error(`[${this.endUser.id}] failed to answer call`);
          console.error(err);
          alert(`[${this.endUser.id}] Failed to answer call.\n` + err);
        });
    }
    else {
      const targetNum = getInputValue(`call-number`);
      const target = `sip:${targetNum}@${hostURL}`;

      this.lineChanged = false;

      if (this.selectLine === `1`) {
        setInputValue(`callerid_line1`, targetNum);
      }
      else {
        setInputValue(`callerid_line2`, targetNum);
      }

      setInputValue(`call-number`, ``);

      if (this.transferState === true) {
        this.endUser
          .makeTransfer(target, undefined, {
            requestDelegate: {
              onReject: (response) => {
                console.warn(`[${this.endUser.id}] INVITE rejected`);
                let message = `Session invitation to "${targetNum}" rejected.\n`;
                message += `Reason: ${response.message.reasonPhrase}\n`;
                message += `Perhaps "${targetNum}" is not connected or registered?\n`;
                message += `Or perhaps "${targetNum}" did not grant access to video?\n`;
                alert(message);
                this.transferState = false;
              }
            }
          })
          .catch((error: Error) => {
            console.error(`[${this.endUser.id}] failed to transfer call`);
            console.error(error);
            alert(`Failed to transfer call.\n` + error);
          });
      }
      else {
        this.endUser
          .call(target, undefined, {
            requestDelegate: {
              onReject: (response) => {
                console.warn(`[${this.endUser.id}] INVITE rejected`);
                let message = `Session invitation to "${targetNum}" rejected.\n`;
                message += `Reason: ${response.message.reasonPhrase}\n`;
                message += `Perhaps "${targetNum}" is not connected or registered?\n`;
                message += `Or perhaps "${targetNum}" did not grant access to video?\n`;
                alert(message);
                this.callState = false;
              }
            }
          })
          .catch((err: Error) => {
            this.callState = false;
            console.error(`Failed to place call`);
            console.error(err);
            alert(`Failed to place call.\n` + err);
          });
      }
    }
  }

  hangupCall(): void {
    this.beginButton.disabled = true;
    this.endButton.disabled = true;
    this.muteButton.disabled = true;
    this.holdButton.disabled = true;

    setInputValue(`call-number`, ``);

    this.callState = false;

    if (this.invitationState === true) {
      ringAudio.pause();
      ringAudio.currentTime = 0;
      this.invitationState = false;
      this.endUser
        .decline()
        .catch((err: Error) => {
          console.error(`[${this.endUser.id}] failed to decline call`);
          console.error(err);
          alert(`[${this.endUser.id}] Failed to decline call.\n` + err);
        });
    }
    else {
      this.endUser.hangup().catch((err: Error) => {
        console.error(`Failed to hangup call`);
        console.error(err);
        alert(`Failed to hangup call.\n` + err);
      });
    }
  }

  onMute(): void {
    this.muteToggle = !this.muteToggle;
    if (this.muteToggle) {
      this.endUser.mute();
      if (this.endUser.isMuted() === false) {
        this.muteToggle = false;
        console.error(`[${this.endUser.id}] failed to mute call`);
        alert(`Failed to mute call.\n`);
      }
    }
    else {
      this.endUser.unmute();
      if (this.endUser.isMuted() === true) {
        this.muteToggle = true;
        console.error(`[${this.endUser.id}] failed to unmute call`);
        alert(`Failed to unmute call.\n`);
      }
    }
  }

  onHold(): void {
    this.holdToggle = !this.holdToggle;
    if (this.holdToggle) {
      this.endUser.hold().catch((error: Error) => {
        this.holdToggle = false;
        console.error(`[${this.endUser.id}] failed to hold call`);
        console.error(error);
        alert(`Failed to hold call.\n` + error);
      });
    }
    else {
      this.endUser.unhold().catch((error: Error) => {
        this.holdToggle = true;
        console.error(`[${this.endUser.id}] failed to unhold call`);
        console.error(error);
        alert(`Failed to unhold call.\n` + error);
      });
    }
  }

  onDnd(): void {
    this.pbxControlService.toggleDnd().subscribe(response => {
      this.dndToggle = response === DndState.Enabled ? true : false;
    });
  }

  makeCallCreatedCallback(user: EndUser): () => void {
    return () => {
      console.log(`[${user.id}] call created`);

      this.beginButton.disabled = true;
      this.endButton.disabled = false;
      this.muteButton.disabled = false;
      this.holdButton.disabled = false;
    };
  }

  makeCallReceivedCallback(callerId: string): void {
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

  makeCallHangupCallback(user: EndUser): () => void {
    return () => {
      console.log(`[${user.id}] call hangup`);

      this.beginButton.disabled = !user.isConnected();
      this.endButton.disabled = false;
      this.muteButton.disabled = false;
      this.holdButton.disabled = false;
    };
  }

  makeRegisteredCallback(user: EndUser): () => void {
    return () => {
      this.pbxControlService.toggleDnd().subscribe(response => {
        this.dndToggle = response === DndState.Enabled ? true : false;
      });
      console.log(`[${user.id}] registered`);
    };
  }

  makeUnregisteredCallback(user: EndUser): () => void {
    return () => {
      console.log(`[${user.id}] unregistered`);
    };
  }

  makeServerConnectCallback(user: EndUser): () => void {
    return () => {
      console.log(`[${user.id}] connected`);
    };
  }

  makeServerDisconnectCallback(user: EndUser): () => void {
    return (err?: Error) => {
      console.log(`[${user.id}] disconnected`);
      if (err) {
        alert(`[${user.id}] Server disconnected.\n` + err.message);
      }
    };
  }

  searchContact(): void {
    const searchWord = getInputValue(`call-number`);
    this.beginButton.disabled = false;
    this.endButton.disabled = true;
    this.muteButton.disabled = true;
    this.holdButton.disabled = true;
    if (searchWord) {
      this.searchResult = this._phoneContacts.filter((ele, i, array) => {
        const eleStr = ele.extension + ele.firstName + ele.lastName;
        const arrayelement = eleStr.toLowerCase();
        return arrayelement.includes(searchWord);
      });
    }
    else {
      this.searchResult = [];
    }
  }

  clickSearchList(extension): void {
    if (extension) {
      setInputValue(`call-number`, extension);

      this.beginButton.disabled = false;
      this.endButton.disabled = true;
      this.muteButton.disabled = true;
      this.holdButton.disabled = true;
    }
    else {
      setInputValue(`call-number`, ``);

      this.beginButton.disabled = true;
      this.endButton.disabled = true;
      this.muteButton.disabled = true;
      this.holdButton.disabled = true;
    }
    this.searchResult = [];
  }

  makeTransfer(): void {
    const btnText = getButtonText('transfer-call');

    if (btnText === 'X-fer' && this.transferState === false) {
      setButtonText(`transfer-call`, `Complete X-fer`);
      this.selectLine = `2`;
      this.endUser.changeLine(1);
      this.transferState = true;
      return;
    } else if (btnText === 'Complete X-fer' && this.transferState === true) {
      setButtonText(`transfer-call`, 'X-fer');
      this.transferState = false;
      this.selectLine = `1`;
      this.endUser.completeTransfer()
        .catch((error: Error) => {
          console.error(`[${this.endUser.id}] failed to complete transfer call`);
          console.error(error);
          alert(`Failed to complete transfer call.\n` + error);
        });
    }

    return;
  }

  changeLine(): void {
    const lineNumber = this.selectLine === '1' ? 0:1;
    this.lineChanged = true;
    this.endUser.changeLine(lineNumber)
  }
}
