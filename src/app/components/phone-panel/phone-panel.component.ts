import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { getAudio } from '../../utilities/ui-utils';
import { EndUser, EndUserOptions, EndUserDelegate } from '../../utilities/end-user';
import { PhoneUser } from '../../models/phoneuser';
import { DndState, PbxControlService } from '../../services/pbxcontrol.service';
import { parseDnd } from '../../utilities/parse-utils';
import { LocalSoundMeter, RemoteSoundMeter } from '../../utilities/sound-meter';
import { MessageContact } from 'src/app/models/messagecontact';
import { PhoneContact } from 'src/app/models/phonecontact';

const webSocketServer = environment.socketServer;
const hostURL = environment.hostURL;
const userAgent = environment.userAgent;
const monitorTarget = environment.monitorTarget;
const confTarget = environment.confTarget;
const incomingRing = new Audio(`assets/sound/incoming_ring.mp3`);
const outgoingRing = new Audio(`assets/sound/outgoing_ring.mp3`);
const hangupRing = new Audio(`assets/sound/hangup.mp3`);
const constraints = {
  audio: true,
  video: false
};

@Component({
  selector: 'app-phone-panel',
  templateUrl: './phone-panel.component.html',
  styleUrls: ['./phone-panel.component.scss']
})
export class PhonePanelComponent implements OnInit {
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

  axferBtnDisabled = true;
  transferStateA = false;
  bxferBtnDisabled = true;
  transferStateB = false;
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

  private micMeterRefresh = null;
  private receiverMeterRefresh = null;
  private userGetRefresh = null;
  private localSoundMeter: LocalSoundMeter = undefined;
  private remoteSoundMeter: RemoteSoundMeter = undefined;
  private audioContext = undefined;
  private phoneUserSubscribe = null;

  constructor(private pbxControlService: PbxControlService) { }

  get phoneUser(): PhoneUser {
    return this._phoneUser;
  }

  set phoneUser(phoneUser: PhoneUser | undefined) {
    this._phoneUser = phoneUser;
  }

  ngOnInit(): void { }

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
      this.callStatus = `Welcome ` + this.phoneUser.displayName;

      this.holdBtnDisabled = true;
      this.muteBtnDisabled = true;
      this.dndBtnDisabled = false;
      this.beginBtnDisabled = false;
      this.endBtnDisabled = true;

      this.axferBtnDisabled = true;
      this.bxferBtnDisabled = true;
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

      this.disconnect();

      this.callStatus = "Unregistered";
      this.registerStatus = false;

      this.holdBtnDisabled = true;
      this.muteBtnDisabled = true;
      this.dndBtnDisabled = true;
      this.beginBtnDisabled = true;
      this.endBtnDisabled = true;

      this.axferBtnDisabled = true;
      this.bxferBtnDisabled = true;
      this.monitorBtnDisabled = true;
      this.messageBtnDisabled = true;
      this.confBtnDisabled = true;
    };
  }

  makeMessageReceivedCallback(): () => void {
    return (fromUser?: string, messageStr?: string) => {
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
      this.selectLine === `1` ? this.lineStatusOne = this.targetNum : this.lineStatusTwo = this.targetNum;

      this.lineCount = this.lineCount + 1;

      this.holdBtnDisabled = true;
      this.muteBtnDisabled = true;
      this.beginBtnDisabled = false;
      this.endBtnDisabled = false;

      this.axferBtnDisabled = true;
      this.bxferBtnDisabled = true;
      this.confBtnDisabled = true;
    };
  }

  makeCallAnsweredCallback(): () => void {
    return () => {
      console.log(`[${this.endUser.id}] call answered`);

      const invitationState = this.invitationState;

      if (invitationState === true) {
        incomingRing.pause();
        incomingRing.currentTime = 0;
      } else {
        outgoingRing.pause();
        outgoingRing.currentTime = 0;
      }

      this.invitationState = false;

      this.callStatus = `Connected`;
      this.selectLine === `1` ? this.lineStatusOne = this.targetNum : this.lineStatusTwo = this.targetNum;

      this.holdBtnDisabled = false;
      this.muteBtnDisabled = false;
      this.beginBtnDisabled = true;
      this.endBtnDisabled = false;

      this.axferBtnDisabled = false;
      this.bxferBtnDisabled = false;
      this.confBtnDisabled = invitationState;

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
    return (displayName?: string, target?: string, autoAnswer?: boolean) => {
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

      this.axferBtnDisabled = true;
      this.bxferBtnDisabled = true;
      this.confBtnDisabled = true;

      if (autoAnswer == true) {
        this.onMakeCall();
      } else {
        incomingRing.volume = 0.8;
        incomingRing.loop = true;
        incomingRing.play();
      }
    }
  }

  makeCallHangupCallback(): () => void {
    return () => {
      console.log(`[${this.endUser.id}] call hangup`);

      if (this.invitationState === true) {
        incomingRing.pause();
        incomingRing.currentTime = 0;
      } else {
        outgoingRing.pause();
        outgoingRing.currentTime = 0;
      }
      
      hangupRing.volume = 0.5;
      hangupRing.loop = false;
      hangupRing.play();

      this.invitationState = false;

      this.selectLine === `1` ? this.lineStatusOne = `CallerID Info` : this.lineStatusTwo = `CallerID Info`;
      this.lineCount = this.lineCount - 1;

      if (this.lineCount > 0) {
        this.changeLine(this.selectLine === `1` ? `2` : `1`);

        this.transferStateA = false;
        this.transferStateB = false;
        this.endBtnDisabled = this.confState === true ? false : this.endBtnDisabled;
      } else {
        this.selectLine = `1`;

        this.callerId = ``;
        this.callStatus = `Call Ended`;

        this.holdStatus = false;
        this.muteStatus = false;

        this.holdBtnDisabled = true;
        this.muteBtnDisabled = true;
        this.beginBtnDisabled = false;
        this.endBtnDisabled = true;

        this.axferBtnDisabled = true;
        this.bxferBtnDisabled = true;
        this.confBtnDisabled = true;

        this.handleMeterStop();
      }
    };
  }

  makeCallHoldCallback(): () => void {
    return (held?: boolean, lineNumber?: number) => {
      console.log(`[${this.endUser.id}], [${lineNumber}] call hold.`);
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
    return (lineNumber?: number) => {
      console.log(`[${this.endUser.id}] line changed to ${lineNumber}`);

      this.selectLine = (lineNumber).toString();

      this.callerId = this.oldCallerId;
      this.callStatus = this.oldCallStatus;

      this.holdStatus = this.endUser.isHeld();
      this.muteStatus = this.endUser.isMuted();

      const sessionEstablished = this.endUser.isEstablished();

      this.holdBtnDisabled = !sessionEstablished;
      this.muteBtnDisabled = !sessionEstablished;
      this.endBtnDisabled = !sessionEstablished;
      this.beginBtnDisabled = sessionEstablished;

      this.axferBtnDisabled = this.transferStateA;
      this.bxferBtnDisabled = this.transferStateB;
      this.confBtnDisabled = this.confState;
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // UserInfo Event Emitter
  onRegister(email: string): void {
    this.callStatus = "Registering";
    this.pbxControlService.loadPhoneUser(email);
    this.phoneUserSubscribe = this.pbxControlService.getPhoneUser().subscribe(userState => {
      this.phoneUser = userState.user;
      if (this.phoneUser) {
        // set user information to localstorage
        localStorage.setItem(`user_name`, this.phoneUser.authName);
        localStorage.setItem(`client_id`, this.phoneUser.clientId);
        this.connect();
      }
    })
  }

  onUnregister(): void {
    this.callStatus = "Unregistering";
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

  onClickNumber(toneNum: string): void {
    if (toneNum && this.endUser.isEstablished()) {
      this.endUser
        .sendDTMF(toneNum)
        .then(() => {
        })
        .catch((error: Error) => {
          console.error(`[${this.endUser.id}] failed to send DTMF`);
          console.error(error);
        })
    }
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
    else if (this.confState === true) {
      this.endUser.terminateConference()
        .then(() => {
          this.confState = false;
        })
        .catch((err: Error) => {
          console.error(`Failed to terminate conference call`);
          console.error(err);
        })
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
        .catch((err: Error) => {
          console.error(`[${this.endUser.id}] failed to answer call`);
          console.error(err);
          return;
        });
    }
    else {
      const target = `sip:${this.targetNum}@${hostURL}`;

      outgoingRing.volume = 0.8;
      outgoingRing.loop = true;
      outgoingRing.play();

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
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Misc Controller Events
  onMakeTransferA(completed: boolean): void {
    if (completed === false) {
      this.endUser
        .changeLine(this.selectLine === `1` ? 2 : 1)
        .then(() => {
          this.transferStateA = true;
          return;
        })
        .catch((error: Error) => {
          this.transferStateA = false;
          console.error(`[${this.endUser.id}] failed to change line`);
          console.error(error);
        });
    }
    else {
      this.transferStateA = false;
      this.lineCount = this.lineCount - 1;
      this.endUser
        .completeTransferA()
        .catch((error: Error) => {
          console.error(`[${this.endUser.id}] failed to complete transfer call`);
          console.error(error);
        });
    }
    return;
  }

  onMakeTransferB(completed: boolean): void {
    if (completed === false) {
      this.transferStateB = true;
    }
    else {
      this.transferStateB = false;
      const target = `sip:${this.targetNum}@${hostURL}`;
      this.endUser
        .completeTransferB(target)
        .catch((error: Error) => {
          console.error(`[${this.endUser.id}] failed to complete transfer call`);
          console.error(error);
        });
    }
    return;
  }

  onMakeConference(completed: boolean): void {
    if (completed === false) {
      this.confState = true;
      this.endUser
        .initConference(this.selectLine === `1` ? 2 : 1)
        .then(() => {
          this.confState = true;
          return;
        })
        .catch((error: Error) => {
          this.confState = false;
          console.error(`[${this.endUser.id}] failed to change line`);
          console.error(error);
        });
    }
    else {
      this.confState = true;
      const target = `sip:${confTarget}@${hostURL}`;
      this.endUser
        .completeConference(target, undefined, {
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
          this.confState = false;
          console.error(`[${this.endUser.id}] failed to complete conference call`);
          console.error(err);
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

  onMessageDialog(): void {
    this.isMessage = !this.isMessage;
    this.receivedMessages = 0;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Line Info Events
  changeLine(selectLine: string): void {
    const lineNumber = parseInt(selectLine, 10);

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

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  handleMeterLocal(stream: any): void {
    this.localSoundMeter = new LocalSoundMeter(this.audioContext);
    this.localSoundMeter.connectToSource(stream, (e: Error) => {
      this.micMeterRefresh = setInterval(() => {
        this.micLiveMeter = this.localSoundMeter.inputInstant;
      }, 1000 / 15);
    });
  }

  handleMeterRemote(stream: any): void {
    this.remoteSoundMeter = new RemoteSoundMeter(this.audioContext);
    this.remoteSoundMeter.connectToSource(stream, (e: Error) => {
      this.receiverMeterRefresh = setInterval(() => {
        this.receiverLiveMeter = this.remoteSoundMeter.calculateAudioLevels();
      }, 1000 / 15);
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