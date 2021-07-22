import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { getAudio } from '../../utilities/ui-utils';
import { EndUser, EndUserOptions, EndUserDelegate } from '../../utilities/platform/web/end-user';
import { PhoneUser } from '../../models/phoneuser';
import { DndState, PbxControlService } from '../../services/pbxcontrol.service';
import { parseDnd } from '../../utilities/parse-utils';
import { LocalSoundMeter, RemoteSoundMeter } from '../../utilities/sound-meter';
import { MessageContact } from 'src/app/models/messagecontact';
import { PhoneContact } from 'src/app/models/phonecontact';
import { PhoneInfo } from 'src/app/models/phoneinfo';

const webSocketServer = environment.socketServer;
const hostURL = environment.hostURL;
const userAgent = environment.userAgent;
const monitorTarget = environment.monitorTarget;
const ringAudio = new Audio(`assets/sound/ring.mp3`);
const constraints = {
  audio: true,
  video: false
};

@Component({
  selector: 'app-popup-phone',
  templateUrl: './popup-phone.component.html',
  styleUrls: ['./popup-phone.component.scss']
})
export class PopupPhoneComponent implements OnInit {
  callerId = null;
  oldCallerId = null;
  callStatus = `Unregistered`;
  oldCallStatus = ``;
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
  holdStatus = false;
  muteStatus = false;

  xferBtnDisabled = true;
  transferState = false;
  monitorBtnDisabled = true;
  messageBtnDisabled = true;
  confState = false;
  confBtnDisabled = true;

  isMessage = false;
  selectedExtension = ``;
  extensionsForReceived: Array<string> = [];
  receivedMessages: number = 0;
  messageContacts: Array<MessageContact> = [];
  phoneContacts: Array<PhoneContact> = [];

  private endUser = null;
  private invitationState = false;
  private targetNum = null;
  private lineCount = 0;

  private _phoneUser: PhoneUser = undefined;
  private _phoneInfo: PhoneInfo = undefined;
  
  private micMeterRefresh = null;
  private receiverMeterRefresh = null;
  private userGetRefresh = null;
  private localSoundMeter: LocalSoundMeter = undefined;
  private remoteSoundMeter: RemoteSoundMeter = undefined;
  private audioContext = undefined;
  private phoneUserSubscribe = null;

  constructor(private pbxControlService: PbxControlService) {}

  get phoneUser(): PhoneUser {
    return this._phoneUser;
  }

  set phoneUser(phoneUser: PhoneUser | undefined) {
    this._phoneUser = phoneUser;
  }

  get phoneInfo(): PhoneInfo {
    return this._phoneInfo;
  }

  set phoneInfo(phoneInfo: PhoneInfo | undefined) {
    this._phoneInfo = phoneInfo;
  }

  ngOnInit(): void {
    this.phoneInfo = JSON.parse(localStorage.getItem(`WebPhone`));
    if (this.phoneInfo) {
      localStorage.setItem(`user_name`, this.phoneInfo.sipUserName);
      this.connect();
    }
  }

  // EndUser Callback functions
  makeServerConnectCallback(): () => void {
    return () => {
      console.log(`[${this.endUser.id}] connected`);
      this.callStatus = "Connected to Server";
    };
  }

  makeServerDisconnectCallback(): () => void {
    return (error?: Error) => {
      console.log(`[${this.endUser.id}] disconnected`);
      this.callStatus = "Disconnected";
      if (error) {
        console.error(`[${this.endUser.id}] Server disconnected.\n` + error.message);
      }
    };
  }

  makeRegisteredCallback(): () => void {
    return () => {
      console.log(`[${this.endUser.id}] registered`);

      this.userGetRefresh = setInterval(() => {
        this.pbxControlService.loadPhoneContacts();        
      }, 3000);

      this.pbxControlService.getPhoneContacts().subscribe(phonecontacts => {
        this.phoneContacts = phonecontacts.contacts;
      });

      this.pbxControlService.loadMessageContacts();

      this.pbxControlService.getMessageContacts().subscribe(messagecontacts => {
        this.messageContacts = messagecontacts.contacts;
      });

      this.pbxControlService.toggleDnd().then(response => {
        //call twice because status get toggled when call api
        this.pbxControlService.toggleDnd().then(response => {
          const dndStatus = parseDnd(response);        
          this.dndStatus = dndStatus === DndState.Enabled ? true : false;
        });
      });

      this.registerStatus = true;
      this.callStatus = `Welcome ${this.phoneInfo.firstName} ${this.phoneInfo.lastName}`;

      this.holdBtnDisabled = true;
      this.muteBtnDisabled = true;
      this.dndBtnDisabled = false;
      this.beginBtnDisabled = false;
      this.endBtnDisabled = true;

      this.xferBtnDisabled = true;
      this.monitorBtnDisabled = false;
      this.messageBtnDisabled = false;
      this.confBtnDisabled = true;
    };
  }

  makeUnregisteredCallback(): () => void {
    return () => {
      console.log(`[${this.endUser.id}] unregistered`);

      clearInterval(this.userGetRefresh);
      localStorage.removeItem(`user_name`);
      localStorage.removeItem(`user_id`);
      
      this.pbxControlService.updatePhoneUser(null);
      this.phoneUser = null;
      this.phoneInfo = null;

      this.disconnect();

      this.callStatus = "Unregistered";
      this.registerStatus = false;

      this.holdBtnDisabled = true;
      this.muteBtnDisabled = true;
      this.dndBtnDisabled = true;
      this.beginBtnDisabled = true;
      this.endBtnDisabled = true;

      this.xferBtnDisabled = true;
      this.monitorBtnDisabled = true;
      this.messageBtnDisabled = true;
      this.confBtnDisabled = true;
    };
  }

  makeMessageReceivedCallback(): () => void {
    return (fromUser?:string, messageStr?: string) => {
      console.log(`[${this.endUser.id}] received message`);
      if (this.isMessage === false) {
        this.receivedMessages++;
      }

      if (this.extensionsForReceived.indexOf(fromUser) === -1 && this.selectedExtension !== fromUser) {
        this.extensionsForReceived.push(fromUser);
      } else if (this.selectedExtension === fromUser) {
        this.pbxControlService.addMessageHistory({
          body: messageStr,
          datetime: new Date(),
          messageId: 0,
          sent: false
        });
      }

      const activeContact = this.messageContacts.find(e => e.extension === fromUser);
      if (activeContact === undefined) {
        const phoneContact = this.phoneContacts.find(e => e.extension === fromUser);
        const addContact: MessageContact = {
          extension: phoneContact.extension,
          firstName: phoneContact.firstName,
          lastName: phoneContact.lastName
        };
        this.pbxControlService.addMessageContact(addContact);
      }
    }
  }

  makeCallCreatedCallback(): () => void {
    return () => {
      console.log(`[${this.endUser.id}] call created`);
      
      this.callStatus = `Dialing`;

      this.lineCount = this.lineCount + 1;
      
      this.holdBtnDisabled = true;
      this.muteBtnDisabled = true;
      this.beginBtnDisabled = false;
      this.endBtnDisabled = false;

      this.xferBtnDisabled = true;
      this.confBtnDisabled = true;
    };
  }

  makeCallAnsweredCallback(): () => void {
    return () => {
      console.log(`[${this.endUser.id}] call answered`);

      ringAudio.pause();
      ringAudio.currentTime = 0;
      this.invitationState = false;

      this.callStatus = `Connected`;
      this.selectLine === `1` ? this.lineStatusOne = this.targetNum : this.lineStatusTwo = this.targetNum;

      this.holdBtnDisabled = false;
      this.muteBtnDisabled = false;
      this.beginBtnDisabled = true;
      this.endBtnDisabled = false;

      this.xferBtnDisabled = false;
      this.confBtnDisabled = false;

      var AudioContext = window.AudioContext;
      this.audioContext = new AudioContext();
      if (this.endUser.localMediaStream !== undefined) {
        this.handleMeterLocal(this.endUser.localMediaStream);
      }
      if (this.endUser.remoteMediaStream !== undefined) {
        this.handleMeterRemote(this.endUser.remoteMediaStream);
      }
    }
  }

  makeCallReceivedCallback(): () => void {
    return (displayName?:string, target?:string, autoAnswer?: boolean) => {      
      console.log(`[${this.endUser.id}] call received`);
      this.invitationState = true;
      this.targetNum = target;

      this.callerId = `${displayName} ${target}`;
      this.callStatus = `Ringing`;      
      this.selectLine === `1` ? this.lineStatusOne = this.targetNum : this.lineStatusTwo = this.targetNum;

      this.holdBtnDisabled = true;
      this.muteBtnDisabled = true;
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
  }

  makeCallHangupCallback(): () => void {
    return () => {
      console.log(`[${this.endUser.id}] call hangup`);

      ringAudio.pause();
      ringAudio.currentTime = 0;
      this.invitationState = false;

      this.selectLine === `1` ? this.lineStatusOne = `CallerID Info` : this.lineStatusTwo = `CallerID Info`;
      
      this.lineCount = this.lineCount - 1;

      if (this.lineCount > 0) {
        this.selectLine = this.selectLine === `1` ? `2` : `1`;
        this.changeLine(this.selectLine);
        if (this.transferState === true) {
          this.transferState = false;
        }
      } else {
        this.callerId = ``;
        this.callStatus = `Call Ended`;
  
        this.holdBtnDisabled = true;
        this.muteBtnDisabled = true;
        this.beginBtnDisabled = false;
        this.endBtnDisabled = true;

        this.xferBtnDisabled = true;
        this.confBtnDisabled = true;

        this.handleMeterStop();
      }
    };
  }

  makeCallHoldCallback(): () => void {
    return (held?:boolean, lineNumber?:number) => {
      console.log(`[${this.endUser.id}], [${lineNumber+1}] call hold.`);
      this.holdStatus = this.endUser.isHeld();
      if (held == false) {
        var AudioContext = window.AudioContext;
        this.audioContext = new AudioContext();
        if (this.endUser.localMediaStream !== undefined) {
          this.handleMeterLocal(this.endUser.localMediaStream);
        }
        if (this.endUser.remoteMediaStream !== undefined) {
          this.handleMeterRemote(this.endUser.remoteMediaStream);
        }
      }
      else {
        this.handleMeterStop();
      }
    }
  }

  makeLineChangedCallback(): () => void {
    return () => {
      console.log(`[${this.endUser.id}] line changed.`);

      this.callerId = this.oldCallerId;
      this.callStatus = this.oldCallerId;

      this.holdStatus = this.endUser.isHeld();
      this.muteStatus = this.endUser.isMuted();
      
      const sessionEstablished = this.endUser.isEstablished();

      this.holdBtnDisabled = !sessionEstablished;
      this.muteBtnDisabled = !sessionEstablished;
      this.endBtnDisabled = !sessionEstablished;
      this.beginBtnDisabled = sessionEstablished;

      this.xferBtnDisabled = this.transferState;
      this.confBtnDisabled = this.confState;
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // UserInfo Event Emitter
  onRegister(): void {
    let email: string = localStorage.getItem(`Email`);
    if (email.charAt(0) === '"' && email.charAt(email.length - 1) === '"') {
      email = email.substr(1, email.length - 2)
    }
    this.pbxControlService.loadPhoneUser(email);
    this.phoneUserSubscribe = this.pbxControlService.getPhoneUser().subscribe(userState => {
      this.phoneUser = userState.user;
      if (this.phoneUser) {
        // set user information to localstorage
        localStorage.setItem(`user_name`, this.phoneUser.authName);
        localStorage.setItem(`user_id`, this.phoneUser.clientId);
        this.connect();
      }
    })
  }

  onUnregister(): void {
    this.phoneUserSubscribe.unsubscribe();
    this.unregister();
  }

  connect(): void {
    const remoteAudio1 = getAudio(`remoteAudio1`);
    const remoteAudio2 = getAudio(`remoteAudio2`);
    const localAudio1 = getAudio(`localAudio1`);
    const localAudio2 = getAudio(`localAudio2`);
    const endUserOptions: EndUserOptions = {
      media: {
        constraints: constraints,
        local1: {
          audio: localAudio1
        },
        local2: {
          audio: localAudio2
        },
        remote1: {
          audio: remoteAudio1
        },
        remote2: {
          audio: remoteAudio2
        }
      },
      userAgentOptions: {
        authorizationPassword: this.phoneInfo.sippassword,
        authorizationUsername: this.phoneInfo.sipUserName,
        forceRport: true,
        contactName: `${this.phoneInfo.firstName} ${this.phoneInfo.lastName}`,
        userAgentString: userAgent,
      },
      aor: `sip:${this.phoneInfo.extension.toString()}@${hostURL}`
    };

    this.endUser = new EndUser(webSocketServer, endUserOptions);

    const delegate: EndUserDelegate = {
      onCallCreated: this.makeCallCreatedCallback(),
      onCallAnswered: this.makeCallAnsweredCallback(),
      onCallReceived: this.makeCallReceivedCallback(),
      onCallHangup: this.makeCallHangupCallback(),
      onRegistered: this.makeRegisteredCallback(),
      onUnregistered: this.makeUnregisteredCallback(),
      onServerConnect: this.makeServerConnectCallback(),
      onServerDisconnect: this.makeServerDisconnectCallback(),
      onMessageReceived: this.makeMessageReceivedCallback(),
      onCallHold: this.makeCallHoldCallback(),
      onLineChanged: this.makeLineChangedCallback(),
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

  disconnect(): void {
    this.endUser
      .disconnect()
      .then(() => {        
      })
      .catch((error: Error) => {
        console.error(`[${this.endUser.id}] failed to disconnect`);
        console.error(error);
      })
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
      this.endUser.hold()
        .catch((error: Error) => {
          console.error(`[${this.endUser.id}] failed to hold call`);
          console.error(error);
        });
    }
    else {
      this.endUser.unhold()
        .catch((error: Error) => {
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
    this.muteStatus = this.endUser.isMuted();
  }

  onDnd(): void {
    this.pbxControlService.toggleDnd().then(response => {
      const dndStatus = parseDnd(response);
      this.dndStatus = dndStatus === DndState.Enabled ? true : false;
    });
  }

  onHangupCall(): void {
    if (this.invitationState === true) {
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

    if (this.invitationState === true) {
      this.endUser
        .answer(undefined)
        .catch( (err: Error) => {
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
      else if (this.confState === true) {
        this.endUser
          .makeConference(target, undefined, {
            requestDelegate: {
              onReject: (response) => {
                console.warn(`[${this.endUser.id}] INVITE rejected`);
                let message = `Session invitation to "${this.targetNum}" rejected.\n`;
                message += `Reason: ${response.message.reasonPhrase}\n`;
                message += `Perhaps "${this.targetNum}" is not connected or registered?\n`;
                message += `Or perhaps "${this.targetNum}" did not grant access to video?\n`;
                console.warn(message);
                this.confState = false;
              }
            }
          })
          .catch((error: Error) => {
            console.error(`[${this.endUser.id}] failed to conference call`);
            console.error(error);
            return;
          })
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
              }
            }
          })
          .catch((err: Error) => {
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
        .initTransfer(changeLineNumber)
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
      this.lineCount = this.lineCount - 1;
      this.endUser
        .completeTransfer()
        .catch((error: Error) => {
          console.error(`[${this.endUser.id}] failed to complete transfer call`);
          console.error(error);
        });
    }
    return;
  }

  onMakeConference(completed: boolean): void {
    if (completed === false) {
      const changeLineNumber = this.selectLine === `1`? 1 : 0;
      this.selectLine = this.selectLine === `1`? `2` : `1`;
      this.endUser
        .initConference(changeLineNumber)
        .then(() => {
          this.confState = true;
          return;
        })
        .catch((error: Error) => {
          this.transferState = false;
          console.error(`[${this.endUser.id}] failed to change line`);
          console.error(error);
        });
    }
    else {
      this.confState = false;
      this.selectLine = this.selectLine === `1`? `2` : `1`;
      this.endUser
        .completeConference()
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
          }
        }
      })
      .catch((err: Error) => {
        console.error(`Failed to place call`);
        console.error(err);
        return;
      });    
  }

  onMessageDialog(): void {
    this.isMessage = !this.isMessage;
    this.receivedMessages = 0;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Line Info Events
  changeLine(selectLine: string): void {
    this.selectLine = selectLine;
    const lineNumber = this.selectLine === `1` ? 0 : 1;
    if (this.endUser === null) {
      return;
    }

    this.oldCallerId = this.callerId;
    this.oldCallStatus = this.callStatus;

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

  onChangeSelExtension(extension: string) {
    this.selectedExtension = extension;
  }

  onHideMessagePanel() {
    this.isMessage = false;
    this.receivedMessages = 0;
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
