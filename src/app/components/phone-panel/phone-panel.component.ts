import { Component, OnInit, AfterViewInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { getAudio } from '../../utilities/ui-utils';
import { EndUser, EndUserOptions, EndUserDelegate } from '../../utilities/platform/web/end-user';
import { PhoneUser } from '../../models/phoneuser';
import { DndState, PbxControlService } from '../../services/pbxcontrol.service';
import { parseDnd, parseWebRtcDemo } from '../../utilities/parse-utils';
import { LocalSoundMeter, RemoteSoundMeter } from '../../utilities/sound-meter';
import { MessageHistory, MessageRecord } from '../../models/messagehistory';

const ringAudio = new Audio(`assets/sound/ring.mp3`);
const webSocketServer = environment.socketServer;
const hostURL = environment.hostURL;
const userAgent = environment.userAgent;
const constraints = {
  audio: true,
  video: false
};
const monitorTarget = `*5`;

@Component({
  selector: 'app-phone-panel',
  templateUrl: './phone-panel.component.html',
  styleUrls: ['./phone-panel.component.scss']
})

export class PhonePanelComponent implements OnInit, AfterViewInit {
  callerId = null;
  callStatus = `Unregistered`;
  registerStatus = false;

  selectLine = `1`;
  micLiveMeter = 100;
  receiverLiveMeter = 100;
  lineStatusOne = `CallerID Info`;
  lineStatusTwo = `CallerID Info`;

  dndStatus = false;
  holdBtnDisabled = true;
  muteBtnDisabled = true;
  dndBtnDisabled = true;
  beginBtnDisabled = true;
  endBtnDisabled = true;

  xferBtnDisabled = true;
  monitorBtnDisabled = true;
  messageBtnDisabled = false;

  isMessage = true;
  selectedExtension = ``;
  activeRecords: Array<MessageRecord> = [];

  private endUser = null;
  private callState = false;
  private transferState = false;
  private invitationState = false;
  private targetNum = null;
  private lineCount = 0;

  private _phoneUser: PhoneUser = undefined;
  
  private micMeterRefresh = null;
  private receiverMeterRefresh = null;
  private localSoundMeter: LocalSoundMeter = undefined;
  private remoteSoundMeter: RemoteSoundMeter = undefined;
  private audioContext = undefined;

  constructor(private pbxControlService: PbxControlService) {}

  get phoneUser(): PhoneUser {
    return this._phoneUser;
  }

  set phoneUser(phoneUser: PhoneUser | undefined) {
    this._phoneUser = phoneUser;
  }

  ngOnInit(): void {    
  }

  ngAfterViewInit(): void {
  }
  
  // EndUser Callback functions
  makeCallCreatedCallback(user: EndUser): () => void {
    return () => {
      console.log(`[${user.id}] call created`);
      this.callStatus = `Dialing`;

      this.holdBtnDisabled = false;
      this.muteBtnDisabled = false;
      this.beginBtnDisabled = false;
      this.endBtnDisabled = false;

      this.xferBtnDisabled = false;

      this.selectLine === `1` ? this.lineStatusOne = this.targetNum : this.lineStatusTwo = this.targetNum;
    };
  }

  makeCallAnsweredCallback(user: EndUser): () => void {
    return () => {
      console.log(`[${user.id}] call answered`);
      this.callStatus = `Connected`;

      this.holdBtnDisabled = false;
      this.muteBtnDisabled = false;
      this.beginBtnDisabled = false;
      this.endBtnDisabled = false;

      this.xferBtnDisabled = false;

      var AudioContext = window.AudioContext;
      this.audioContext = new AudioContext();
      if (user.localMediaStream !== undefined) {
        this.handleMeterLocal(user.localMediaStream);
      }
      if (user.remoteMediaStream !== undefined) {
        this.handleMeterRemote(user.remoteMediaStream);
      }
    }
  }

  makeCallReceivedCallback(callerId: string, autoAnswer: boolean): void {
    console.log(`[${this.endUser.id}] call received`);
    this.callerId = callerId;
    this.callStatus = `Ringing`;
    this.invitationState = true;
    this.selectLine === `1` ? this.lineStatusOne = `Call Received` : this.lineStatusTwo = `Call Received`;

    this.holdBtnDisabled = false;
    this.muteBtnDisabled = false;
    this.beginBtnDisabled = false;
    this.endBtnDisabled = false;

    this.xferBtnDisabled = true;

    if (autoAnswer == true) {
      this.onMakeCall();
    } else {
      ringAudio.loop = true;
      ringAudio.autoplay = true;
      ringAudio.play();
    }
  }

  makeCallHangupCallback(user: EndUser): () => void {
    return () => {
      console.log(`[${user.id}] call hangup`);
      this.selectLine === `1` ? this.lineStatusOne = `Call Ended` : this.lineStatusTwo = `Call Ended`;
      this.callState = false;
      this.callStatus = `Call Ended`;
      this.callerId = ``;

      this.holdBtnDisabled = true;
      this.muteBtnDisabled = true;
      this.beginBtnDisabled = false;
      this.endBtnDisabled = this.lineCount === 0 ? true : false;

      this.xferBtnDisabled = true;
      
      this.handleMeterStop();
    };
  }

  makeRegisteredCallback(user: EndUser): () => void {
    return () => {      
      this.pbxControlService.loadPhoneContacts();
      this.pbxControlService.getPhoneContacts().subscribe(contacts => {
        this.pbxControlService.loadMessageHistories(contacts.data);
      });

      this.pbxControlService.toggleDnd().subscribe(response => {
        //call twice because status get toggled when call api
        this.pbxControlService.toggleDnd().subscribe(response => {
          const dndStatus = parseDnd(response);        
          this.dndStatus = dndStatus === DndState.Enabled ? true : false;
        });
      });
      console.log(`[${user.id}] registered`);
      this.registerStatus = true;
      this.callStatus = `Welcome ` + this.phoneUser.displayName;

      this.holdBtnDisabled = true;
      this.muteBtnDisabled = true;
      this.dndBtnDisabled = false;
      this.beginBtnDisabled = false;
      this.endBtnDisabled = true;

      this.xferBtnDisabled = true;
      this.monitorBtnDisabled = false;
      this.messageBtnDisabled = false;
    };
  }

  makeUnregisteredCallback(user: EndUser): () => void {
    return () => {
      console.log(`[${user.id}] unregistered`);
      this.registerStatus = false;
      this.callStatus = "Unregistered";

      this.holdBtnDisabled = true;
      this.muteBtnDisabled = true;
      this.dndBtnDisabled = true;
      this.beginBtnDisabled = true;
      this.endBtnDisabled = true;

      this.xferBtnDisabled = true;
      this.monitorBtnDisabled = true;
      this.messageBtnDisabled = true;
    };
  }

  makeServerConnectCallback(user: EndUser): () => void {
    return () => {
      console.log(`[${user.id}] connected`);
      this.callStatus = "Connected to Server";
    };
  }

  makeServerDisconnectCallback(user: EndUser): () => void {
    return (err?: Error) => {
      console.log(`[${user.id}] disconnected`);
      this.callStatus = "Disconnected";
      if (err) {
        console.error(`[${user.id}] Server disconnected.\n` + err.message);
      }
    };
  }

  makeMessageReceivedCallback(): () => void {
    return (fromUser?:string, messageStr?: string) => {
      console.log(`[${this.endUser.id}] received message`);

      console.log(`+++++++++++++++++++++++++`, fromUser);

      this.selectedExtension = fromUser;
      const receivedMsg: MessageRecord = {
        body: messageStr,
        datetime: ``,
        messageId: 0,
        sent: true
      };

      this.pbxControlService.addMessageRecord(this.selectedExtension, receivedMsg);
      this.isMessage = true;
    }
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // UserInfo Event Emitter
  onRegister(email: string): void {
    this.pbxControlService.webRtcDemo(email).subscribe(response => {
      this.phoneUser = parseWebRtcDemo(response);
      if (this.phoneUser) {
        // set user information to localstorage
        localStorage.setItem(`user_name`, this.phoneUser.authName);
        localStorage.setItem(`user_id`, this.phoneUser.clientId);
        this.connect();
      }
    })
  }

  onUnregister(): void {
    this.unregister();
    this.phoneUser = undefined;
    localStorage.removeItem(`user_name`);
    localStorage.removeItem(`user_id`);
  }

  connect(): void {
    const remoteAudio = getAudio(`remoteAudio`);
    const localAudio = getAudio(`localAudio`);
    const endUserOptions: EndUserOptions = {
      media: {
        constraints: constraints,
        local: {
          audio: localAudio
        },
        remote: {
          audio: remoteAudio
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
      onCallAnswered: this.makeCallAnsweredCallback(this.endUser),
      onCallReceived: (callerId: string, autoAnswer: boolean): void => this.makeCallReceivedCallback(callerId, autoAnswer),
      onCallHangup: this.makeCallHangupCallback(this.endUser),
      onRegistered: this.makeRegisteredCallback(this.endUser),
      onUnregistered: this.makeUnregisteredCallback(this.endUser),
      onServerConnect: this.makeServerConnectCallback(this.endUser),
      onServerDisconnect: this.makeServerDisconnectCallback(this.endUser),
      onMessageReceived: this.makeMessageReceivedCallback(),
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
      });
  }

  register(): void {
    this.endUser
      .register(undefined)
      .then(() => {
      })
      .catch((error: Error) => {
        console.error(`[${this.endUser.id}] failed to register`);
        console.error(error);
      });
  }

  unregister(): void {
    this.endUser
      .unregister()
      .then(() => {
      })
      .catch((error: Error) => {
        console.error(`[${this.endUser.id}] failed to unregister`);
        console.error(error);
      });
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Phone Control Events Emitter
  onChangeNumber(value: string): void {
    this.targetNum = value;
  }

  onHold(value: boolean): void {
    if (this.endUser === null) {
      return;
    }

    if (value) {
      this.endUser.hold().catch((error: Error) => {
        console.error(`[${this.endUser.id}] failed to hold call`);
        console.error(error);
      });
    }
    else {
      this.endUser.unhold().catch((error: Error) => {
        console.error(`[${this.endUser.id}] failed to unhold call`);
        console.error(error);
      });
    }
  }

  onMute(value: boolean): void {
    if (this.endUser === null) {
      return;
    }

    if (value) {
      this.endUser.mute();
      if (this.endUser.isMuted() === false) {
        console.error(`[${this.endUser.id}] failed to mute call`);
      }
    }
    else {
      this.endUser.unmute();
      if (this.endUser.isMuted() === true) {
        console.error(`[${this.endUser.id}] failed to unmute call`);
      }
    }
  }

  onDnd(): void {
    this.pbxControlService.toggleDnd().subscribe(response => {
      const dndStatus = parseDnd(response);
      this.dndStatus = dndStatus === DndState.Enabled ? true : false;
    });
  }

  onHangupCall(): void {
    this.callState = false;
    this.lineCount = this.lineCount - 1;

    if (this.invitationState === true) {
      ringAudio.pause();
      ringAudio.currentTime = 0;
      this.invitationState = false;
      this.endUser
        .decline()
        .catch((err: Error) => {
          console.error(`[${this.endUser.id}] failed to decline call`);
          console.error(err);
        });
    }
    else {
      this.endUser.hangup().catch((err: Error) => {
        console.error(`Failed to hangup call`);
        console.error(err);
      });
    }
  }

  onMakeCall(): void {
    if (!this.endUser.registerer.registered) {
      console.error(`Failed to call, have to register`);
      return;
    }

    this.callState = true;
    this.lineCount = this.lineCount + 1;

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
          return;
        });
    }
    else {
      const target = `sip:${this.targetNum}@${hostURL}`;
      if (this.transferState === true) {
        this.endUser
          .makeTransfer(target, undefined, {
            requestDelegate: {
              onReject: (response) => {
                console.warn(`[${this.endUser.id}] INVITE rejected`);
                let message = `Session invitation to "${this.targetNum}" rejected.\n`;
                message += `Reason: ${response.message.reasonPhrase}\n`;
                message += `Perhaps "${this.targetNum}" is not connected or registered?\n`;
                message += `Or perhaps "${this.targetNum}" did not grant access to video?\n`;
                console.warn(message);
                this.transferState = false;
              }
            }
          })
          .catch((error: Error) => {
            console.error(`[${this.endUser.id}] failed to transfer call`);
            console.error(error);
            return;
          });
      }
      else {
        this.endUser
          .call(target, undefined, {
            requestDelegate: {
              onReject: (response) => {
                console.warn(`[${this.endUser.id}] INVITE rejected`);
                let message = `Session invitation to "${this.targetNum}" rejected.\n`;
                message += `Reason: ${response.message.reasonPhrase}\n`;
                message += `Perhaps "${this.targetNum}" is not connected or registered?\n`;
                message += `Or perhaps "${this.targetNum}" did not grant access to video?\n`;
                console.warn(message);
                this.callState = false;
              }
            }
          })
          .catch((err: Error) => {
            this.callState = false;
            console.error(`Failed to place call`);
            console.error(err);
            return;
          });
      }
    }
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Misc Controller Events
  onMakeTransfer(completed: boolean): void {
    if (completed === false) {
      const changeLineNumber = this.selectLine === `1`? 1 : 0;
      this.selectLine = this.selectLine === `1`? `2` : `1`;
      this.endUser
        .changeLineForTransfer(changeLineNumber)
        .then(() => {
          this.transferState = true;
          return;
        })
        .catch((error: Error) => {
          this.transferState = false;
          console.error(`[${this.endUser.id}] failed to change line`);
          console.error(error);
        });
    }
    else {
      this.transferState = false;
      this.selectLine = this.selectLine === `1`? `2` : `1`;
      this.endUser.completeTransfer()
        .catch((error: Error) => {
          console.error(`[${this.endUser.id}] failed to complete transfer call`);
          console.error(error);
        });
    }
    return;
  }

  onDialMonitor(): void {
    if (this.endUser === null) {
      return;
    }
    const target = `sip:${monitorTarget}@${hostURL}`;
    this.endUser
      .call(target, undefined, {
        requestDelegate: {
          onReject: (response) => {
            console.warn(`[${this.endUser.id}] INVITE rejected`);
            let message = `Session invitation to "${this.targetNum}" rejected.\n`;
            message += `Reason: ${response.message.reasonPhrase}\n`;
            message += `Perhaps "${this.targetNum}" is not connected or registered?\n`;
            message += `Or perhaps "${this.targetNum}" did not grant access to video?\n`;
            console.log(message);
            this.callState = false;
          }
        }
      })
      .catch((err: Error) => {
        this.callState = false;
        console.error(`Failed to place call`);
        console.error(err);
        return;
      });    
  }

  onMessageDialog(): void {
    this.isMessage = !this.isMessage;
  }

  onClickOutsideMessage(e: Event): void {
    const targetText = (e.target as Element).textContent.toLowerCase();
    
    if (targetText !== `message` && targetText !== `send`) {
      this.isMessage = false;
    }
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Line Info Events
  changeLine(selectLine: string): void {
    this.selectLine = selectLine;
    const lineNumber = this.selectLine === `1` ? 0 : 1;
    if (this.endUser === null) {
      return;
    }
    this.endUser
      .changeLine(lineNumber)
      .catch((error: Error) => {
        console.error(`[${this.endUser.id}] failed to change line`);
        console.error(error);
      });
  }

  changeReceiverVolume(volume: number): void {
    const remoteAudio = getAudio(`remoteAudio`);
    remoteAudio.volume = volume;
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Message Panel Events
  onSendMessage(messageObj: any) {
    const extensionNum = messageObj.extension;
    const messageStr = messageObj.message;
    if (this.endUser === null) {
      return;
    }
    const target = `sip:${extensionNum}@${hostURL}`
    this.endUser
      .message(target, messageStr)
      .catch((error: Error) => {
        console.error(`[${this.endUser.id}] failed to send message`);
        console.error(error);
      });
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  handleMeterLocal(stream: any): void {
    this.localSoundMeter = new LocalSoundMeter(this.audioContext);
    this.localSoundMeter.connectToSource(stream, (e: Error) => {
      this.micMeterRefresh = setInterval(() => {
        this.micLiveMeter = this.localSoundMeter.inputInstant;
      }, 1000/15);
    });
  }

  handleMeterRemote(stream: any): void {
    this.remoteSoundMeter = new RemoteSoundMeter(this.audioContext);
    this.remoteSoundMeter.connectToSource(stream, (e: Error) => {
      this.receiverMeterRefresh = setInterval(() => {
        this.receiverLiveMeter = this.remoteSoundMeter.calculateAudioLevels();
      }, 1000/15);
    });
  }

  handleMeterStop(): void {
    if (this.remoteSoundMeter !== undefined) {
      this.remoteSoundMeter.stop();
    }

    if (this.localSoundMeter !== undefined) {
      this.localSoundMeter.stop();
    }

    clearInterval(this.micMeterRefresh);
    clearInterval(this.receiverMeterRefresh);
    this.micLiveMeter = 100;
    this.receiverLiveMeter = 100;
  }
}
