import { AfterViewInit, Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { addInputValue, delInputValue, getInputValue, setInputValue, getAudio, getButton, setButtonText, getButtonText, getSpan } from '../../utilities/ui-utils';
import { EndUser, EndUserOptions, EndUserDelegate } from '../../utilities/platform/web/end-user';
import { PhoneUser } from '../../models/phoneuser';
import { PhoneContact } from '../../models/phonecontact';
import { DndState, PbxControlService } from '../../services/pbxcontrol.service';
import { parseDnd, parseWebRtcDemo } from '../../utilities/parse-utils';
import { SoundMeter } from '../../utilities/sound-meter';

const ringAudio = new Audio(`assets/sound/ring.mp3`);
const webSocketServer = environment.socketServer;
const hostURL = environment.hostURL;
const userAgent = environment.userAgent;
const constraints = {
  audio: true,
  video: false
};

@Component({
  selector: 'app-phone-panel',
  templateUrl: './phone-panel.component.html',
  styleUrls: ['./phone-panel.component.scss']
})

export class PhonePanelComponent implements OnInit, AfterViewInit {
  callerId = null;
  searchBtnToggle = false;
  numberBtnToggle = false;
  muteToggle = false;
  holdToggle = false;
  dndToggle = false;
  receiverCtrlToggle = false;  
  receiverVolume = 0.0;
  micLiveMeter = 0;
  receiverLiveMeter = 0;

  searchResult = [];
  selectLine = `1`;

  private micMeterRefresh = null;
  private receiverMeterRefresh = null;

  private endUser = null;
  private callState = false;
  private transferState = false;
  private lineChanged = false;
  private invitationState = false;
  private _phoneUser: PhoneUser = undefined;
  private _phoneContacts: Array<PhoneContact> = [];
  private soundMeter: SoundMeter = undefined;

  private beginButton = null;
  private endButton = null;
  private muteButton = null;
  private holdButton = null;
  private xferButton = null;
  private dndButton = null;
  
  private audioContext = undefined;

  constructor(private pbxControlService: PbxControlService) {

  }

  get phoneUser(): PhoneUser {
    return this._phoneUser;
  }

  set phoneUser(phoneUser: PhoneUser | undefined) {
    this._phoneUser = phoneUser;
  }

  ngOnInit(): void {
    
  }

  ngAfterViewInit(): void {
    const numberToggle = getButton(`number-toggle`);
    numberToggle.addEventListener(`click`, () => {
      this.numberBtnToggle = !this.numberBtnToggle;
      this.searchBtnToggle = false;
    });

    const searchBtn = getButton(`search-toggle`);
    searchBtn.addEventListener(`click`, () => {
      this.searchResult = this.searchBtnToggle? this._phoneContacts : [];
      this.searchBtnToggle = !this.searchBtnToggle;
      this.numberBtnToggle = false;      
    });

    const receiverSpan = getSpan(`receiver-control`);
    receiverSpan.addEventListener(`click`, () => {
      this.receiverCtrlToggle = !this.receiverCtrlToggle;
      const remoteAudio = getAudio(`remoteAudio`);
      if (this.endUser && this.endUser.remoteAudioTrack !== undefined) {
        const audioTrack = this.endUser.remoteAudioTrack;
        const settings = audioTrack.getSettings();
        const volume = settings.map(setting => setting.volume);
        remoteAudio.volume = volume;
      }
      this.receiverVolume = remoteAudio.volume * 100;     
    })

    this.beginButton = getButton(`begin-call`);
    this.endButton = getButton(`end-call`);
    this.muteButton = getButton(`mute-btn`);
    this.holdButton = getButton(`hold-btn`);
    this.xferButton = getButton(`transfer-call`);
    this.dndButton = getButton(`dnd-btn`);

    this.beginButton.disabled = true;
    this.endButton.disabled = true;
    this.muteButton.disabled = true;
    this.holdButton.disabled = true;
    this.xferButton.disabled = true;
    this.dndButton.disabled = true;
  }

  onRegister(): void {
    const email = getInputValue(`email`);

    if (email === undefined) {
      console.log(`Input the email address`);
      alert(`Input the email address`);
      return
    }

    const btnText = getButtonText(`register-btn`);

    if (btnText === `Register`) {
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
    else if (btnText === `Unregister`) {
      this.unregister();
      this.phoneUser = undefined;
      this._phoneContacts = [];
      localStorage.removeItem(`user_name`);
      localStorage.removeItem(`user_id`);
    }
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
      onCallReceived: (callerId: string, autoAnswer: boolean): void => this.makeCallReceivedCallback(callerId, autoAnswer),
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
      .then(() => {
        setButtonText(`register-btn`, `Unregister`);
        this.dndButton.disabled = false;
      })
      .catch((error: Error) => {
        console.error(`[${this.endUser.id}] failed to register`);
        console.error(error);
        alert(`[${this.endUser.id}] Failed to register.\n` + error);
      });
  }

  unregister(): void {
    this.endUser
      .unregister()
      .then(() => {
        setButtonText(`register-btn`, `Register`);
        this.dndButton.disabled = true;
      })
      .catch((error: Error) => {
        console.error(`[${this.endUser.id}] failed to unregister`);
        console.error(error);
        alert(`[${this.endUser.id}] Failed to unregister.\n` + error);
      });
  }

  clickNumber(toneNum: string): void {
    if (this.endUser === null) {
      return;
    }

    if (toneNum === "clear") {
      delInputValue(`call-number`);
      return;
    }
    
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
        })
        .catch((err: Error) => {
          console.error(`[${this.endUser.id}] failed to send DTMF`);
          console.error(err);
          alert(`[${this.endUser.id}] Failed to send DTMF.\n` + err);
          addInputValue(`call-number`, toneNum);
        });
    }
  }

  handleMeterSuccess(stream: any): void {
    console.log(`++++++++++++++++++++++++++++`, stream);
    console.log(`++++++++++++++++++++++++++++++`, this.audioContext);

    window.MediaStream = stream;
    this.soundMeter = new SoundMeter(this.audioContext);
    this.soundMeter.connectToSource(stream, (e: Error) => {
      if (e) {
        alert(e);
        return;
      }
      this.micMeterRefresh = setInterval(() => {
        this.micLiveMeter = this.soundMeter.inputInstant;
      }, 1000/15);

      this.receiverMeterRefresh = setInterval(() => {
        this.receiverLiveMeter = this.soundMeter.calculateAudioLevels();
        console.log(`++++++++++++++++++++++++++`, this.receiverLiveMeter.toFixed(2));
      }, 1000/15);
    })
  }

  handleMeterStop(stream: any): void {
    stream.getTracks().forEach(track => track.stop());
    this.soundMeter.stop();    
    clearInterval(this.micMeterRefresh);
    clearInterval(this.receiverMeterRefresh);
    this.micLiveMeter = 0;
    this.receiverLiveMeter = 0;
  }

  makeCall(): void {
    if (!this.endUser.registerer.registered) {
      console.error(`Failed to call, have to register`);
      return;
    }

    var AudioContext = window.AudioContext;
    this.audioContext = new AudioContext();
    
    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        this.handleMeterSuccess(stream);
      })
      .catch((err) => {
        console.log(`navigator.MediaDevices.getUserMedia error: `, err.message, err.name);    
      });

    this.beginButton.disabled = true;
    this.endButton.disabled = false;
    this.muteButton.disabled = false;
    this.holdButton.disabled = false;
    this.xferButton.disabled = false;

    this.callState = true;

    this.numberBtnToggle = false;
    this.searchBtnToggle = false;

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
    this.xferButton.disabled = true;

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

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        this.handleMeterStop(stream);
      })
      .catch((err) => {
        console.log(`navigator.MediaDevices.getUserMedia error: `, err.message, err.name);    
      });
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
      const dndStatus = parseDnd(response);
      this.dndToggle = dndStatus === DndState.Enabled ? true : false;
    });
  }

  makeCallCreatedCallback(user: EndUser): () => void {
    return () => {
      console.log(`[${user.id}] call created`);

      this.beginButton.disabled = true;
      this.endButton.disabled = false;
      this.muteButton.disabled = false;
      this.holdButton.disabled = false;
      this.xferButton.disabled = false;
    };
  }

  makeCallReceivedCallback(callerId: string, autoAnswer: boolean): void {
    this.callerId = callerId;

    this.beginButton.disabled = false;
    this.endButton.disabled = false;
    this.muteButton.disabled = true;
    this.holdButton.disabled = true;
    this.xferButton.disabled = true;

    this.invitationState = true;

    if (autoAnswer == true) {
      this.makeCall();
    } else {
      ringAudio.loop = true;
      ringAudio.autoplay = true;
      ringAudio.play();
    }
  }

  makeCallHangupCallback(user: EndUser): () => void {
    return () => {
      console.log(`[${user.id}] call hangup`);

      this.callState = false;

      this.beginButton.disabled = true;
      this.endButton.disabled = true;
      this.muteButton.disabled = true;
      this.holdButton.disabled = true;
      this.xferButton.disabled = true;

      this.callerId = ``;
    };
  }

  makeRegisteredCallback(user: EndUser): () => void {
    return () => {
      this.pbxControlService.load();
      this.pbxControlService.getPhoneContacts().subscribe(phonecontacts => {
        this._phoneContacts = phonecontacts.data;
      });
      
      this.pbxControlService.toggleDnd().subscribe(response => {
        //call twice because status get toggled when call api
        this.pbxControlService.toggleDnd().subscribe(response => {
          const dndStatus = parseDnd(response);        
          this.dndToggle = dndStatus === DndState.Enabled ? true : false;
        });
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

    this.endButton.disabled = true;
    this.muteButton.disabled = true;
    this.holdButton.disabled = true;
    this.xferButton.disabled = true;

    if (searchWord) {
      this.beginButton.disabled = false;
      this.searchResult = this._phoneContacts.filter((ele, i, array) => {
        const eleStr = ele.extension + ele.firstName + ele.lastName;
        const arrayelement = eleStr.toLowerCase();
        return arrayelement.includes(searchWord);
      });
    }
    else {
      this.beginButton.disabled = true;
      this.searchResult = [];
    }
  }

  clickSearchList(extension: string): void {
    this.endButton.disabled = true;
    this.muteButton.disabled = true;
    this.holdButton.disabled = true;
    this.xferButton.disabled = true;

    if (extension) {
      setInputValue(`call-number`, extension);
      this.beginButton.disabled = false;
    }
    else {
      setInputValue(`call-number`, ``);
      this.beginButton.disabled = true;
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
    if (this.endUser === null) {
      return;
    }
    this.endUser
      .changeLine(lineNumber)
      .catch((error: Error) => {
        console.error(`[${this.endUser.id}] failed to change line`);
        console.error(error);
        alert(`Failed to change line.\n` + error);
      })
  }

  changeReceiverVolume(): void {
    const remoteAudio = getAudio(`remoteAudio`);    
    const volume = Math.round(this.receiverVolume) / 100;
    remoteAudio.volume = parseFloat(volume.toFixed(2));
  }
}
