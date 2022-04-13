import {
  Info,
  Bye,
  Invitation,
  InvitationAcceptOptions,
  Inviter,
  InviterInviteOptions,
  InviterOptions,
  Message,
  Messager,
  Referral,
  Registerer,
  RegistererOptions,
  RegistererRegisterOptions,
  RegistererState,
  RegistererUnregisterOptions,
  RequestPendingError,
  Session,
  SessionInviteOptions,
  SessionState,
  URI,
  UserAgent,
  UserAgentOptions,
  UserAgentState
} from 'sip.js';
import {Logger, OutgoingReferRequest} from 'sip.js/lib/core';
import {SessionDescriptionHandler, SessionDescriptionHandlerOptions} from 'sip.js/lib/platform/web/session-description-handler';
import {Transport} from '../transport';
import {EndUserDelegate} from './end-user-delegate';
import {EndUserOptions} from './end-user-options';

interface LineSession {
  target: URI;
  session: Session;
  held: boolean;
  muted: boolean;
}

export class EndUser {
  /** Delegate. */
  public delegate: EndUserDelegate | undefined;
  private attemptingReconnection = false;
  private connectRequested = false;
  private logger: Logger;
  private options: EndUserOptions;
  private registerer: Registerer | undefined = undefined;
  private registerRequested = false;
  private userAgent: UserAgent;
  private confTarget: URI | undefined = undefined;
  private lineSessions: Array<LineSession> = [
    {target: undefined, session: undefined, held: false, muted: false},
    {target: undefined, session: undefined, held: false, muted: false},
    {target: undefined, session: undefined, held: false, muted: false}
  ];
  private _curLineNumber: number = 0;
  private _firstLineNumber: number = 0;
  private _secondLineNumber: number = 0;

  constructor(server: string, options: EndUserOptions = {}) {

    this.delegate = options.delegate;

    this.options = { ...options };

    const userAgentOptions: UserAgentOptions = {
      ...options.userAgentOptions
    };

    if (!userAgentOptions.transportConstructor) {
      userAgentOptions.transportConstructor = Transport;
    }

    if (!userAgentOptions.transportOptions) {
      userAgentOptions.transportOptions = {
        server
      };
    }

    if (!userAgentOptions.uri) {
      if (options.aor) {
        const uri = UserAgent.makeURI(options.aor);
        if (!uri) {
          throw new Error(`Failed to create valid URI from ${options.aor}`);
        }
        userAgentOptions.uri = uri;
      }
    }

    this.userAgent = new UserAgent(userAgentOptions);

    this.userAgent.delegate = {
      onConnect: (): void => {
        this.logger.log(`[${this.id}] Connected`);
        if (this.delegate && this.delegate.onServerConnect) {
          this.delegate.onServerConnect();
        }
        if (this.registerer && this.registerRequested) {
          this.logger.log(`[${this.id}] Registering...`);
          this.registerer.register().catch((e: Error) => {
            this.logger.error(`[${this.id}] Error occurred registering after connection with server was obtained.`);
            this.logger.error(e.toString());
          });
        }
      },
      onDisconnect: (error?: Error): void => {
        this.logger.log(`[${this.id}] Disconnected`);
        if (this.delegate && this.delegate.onServerDisconnect) {
          this.delegate.onServerDisconnect(error);
        }
        if (this.session) {
          this.logger.log(`[${this.id}] Hanging up...`);
          this.hangup() // cleanup hung calls
            .catch((e: Error) => {
              this.logger.error(`[${this.id}] Error occurred hanging up call after connection with server was lost.`);
              this.logger.error(e.toString());
            });
        }
        if (this.registerer) {
          this.logger.log(`[${this.id}] Unregistering...`);
          this.registerer
            .unregister()
            .catch((e: Error) => {
              this.logger.error(`[${this.id}] Error occurred unregistering after connection with server was lost.`);
              this.logger.error(e.toString());
            });
        }
      },
      onInvite: (invitation: Invitation): void => {
        this.logger.log(`[${this.id}] Received INVITE`);
        if (this.session) {
          const line = this.getLine(this.curLineNumber == 0? 1 : 0);
          if (line.session) {
            this.logger.warn(`[${this.id}] Session already in progress, rejecting INVITE...`);
            invitation
              .reject()
              .then(() => {
                this.logger.log(`[${this.id}] Rejected INVITE`);
              })
              .catch((error: Error) => {
                this.logger.error(`[${this.id}] Failed to reject INVITE`);
                this.logger.error(error.toString());
              });
            return;
          }
          this.curLineNumber = this.curLineNumber == 0? 1 : 0;
          if (this.delegate && this.delegate.onLineChanged) {
            this.delegate.onLineChanged();
          }
        }

        const referralInviterOptions: InviterOptions = {
          sessionDescriptionHandlerOptions: { constraints: this.constraints }
        };

        this.initSession(invitation, referralInviterOptions);

        const uri = this.session.remoteIdentity.uri;
        const displayName = this.session.remoteIdentity.displayName;

        let autoAnswer = false;
        const headers = invitation.request.headers;
        if (headers['Call-Info'] !== undefined) {
          const callInfo = headers['Call-Info'];
          const callInfoData = callInfo[0].raw;
          if (callInfoData.indexOf(`answer-after=0`) > -1) {
            autoAnswer = true
          }
        }

        if (this.delegate && this.delegate.onCallReceived) {
          this.delegate.onCallReceived(displayName, uri.user, autoAnswer);
        } else {
          this.logger.warn(`[${this.id}] No handler available, rejecting INVITE...`);
          invitation
            .reject()
            .then(() => {
              this.logger.log(`[${this.id}] Rejected INVITE`);
            })
            .catch((error: Error) => {
              this.logger.error(`[${this.id}] Failed to reject INVITE`);
              this.logger.error(error.toString());
            });
        }
      },
      onMessage: (message: Message): void => {
        message.accept().then(() => {          
          const uri = message.request.from.uri;
          const fromUser = uri.user;
          if (this.delegate && this.delegate.onMessageReceived) {
            this.delegate.onMessageReceived(fromUser, message.request.body);
          }
        });
      },
    };

    this.logger = this.userAgent.getLogger(`sip.EndUser`);

    window.addEventListener(`online`, () => {
      this.logger.log(`[${this.id}] Online`);
      this.attemptReconnection();
    });
  }

  get id(): string {
    return (this.options.userAgentOptions && this.options.userAgentOptions.displayName) || `Anonymous`;
  }

  get localMediaStream(): MediaStream | undefined {
    const sdh = this.session? this.session.sessionDescriptionHandler : undefined;
    if (!sdh) {
      return undefined;
    }
    if (!(sdh instanceof SessionDescriptionHandler)) {
      throw new Error(`Session description handler not instance of web SessionDescriptionHandler`);
    }
    return sdh.localMediaStream;
  }

  get remoteMediaStream(): MediaStream | undefined {
    const sdh = this.session? this.session.sessionDescriptionHandler : undefined;
    if (!sdh) {
      return undefined;
    }
    if (!(sdh instanceof SessionDescriptionHandler)) {
      throw new Error(`Session description handler not instance of web SessionDescriptionHandler`);
    }
    return sdh.remoteMediaStream;
  }

  get localAudioTrack(): MediaStreamTrack | undefined {
    return this.localMediaStream?.getTracks().find((track) => track.kind === `audio`);
  }

  get localVideoTrack(): MediaStreamTrack | undefined {
    return this.localMediaStream?.getTracks().find((track) => track.kind === `video`);
  }

  get remoteAudioTrack(): MediaStreamTrack | undefined {
    return this.remoteMediaStream?.getTracks().find((track) => track.kind === `audio`);
  }

  get remoteVideoTrack(): MediaStreamTrack | undefined {
    return this.remoteMediaStream?.getTracks().find((track) => track.kind === `video`);
  }

  public connect(): Promise<void> {
    this.logger.log(`[${this.id}] Connecting UserAgent...`);
    this.connectRequested = true;
    if (this.userAgent.state !== UserAgentState.Started) {
      return this.userAgent.start();
    }
    return this.userAgent.reconnect();
  }

  public disconnect(): Promise<void> {
    this.logger.log(`[${this.id}] Disconnecting UserAgent...`);
    this.connectRequested = false;
    return this.userAgent.stop();
  }

  public isConnected(): boolean {
    return this.userAgent.isConnected();
  }

  public register(
    registererOptions?: RegistererOptions,
    registererRegisterOptions?: RegistererRegisterOptions
  ): Promise<void> {
    this.logger.log(`[${this.id}] Registering UserAgent...`);
    this.registerRequested = true;

    if (!this.registerer) {
      this.registerer = new Registerer(this.userAgent, registererOptions);
      this.registerer.stateChange.addListener((state: RegistererState) => {
        switch (state) {
          case RegistererState.Initial:
            break;
          case RegistererState.Registered:
            if (this.delegate && this.delegate.onRegistered) {
              this.delegate.onRegistered();
            }
            break;
          case RegistererState.Unregistered:
            if (this.delegate && this.delegate.onUnregistered) {
              this.delegate.onUnregistered();
            }
            break;
          case RegistererState.Terminated:
            this.registerer = undefined;
            break;
          default:
            throw new Error(`Unknown registerer state.`);
        }
      });
    }

    return this.registerer.register(registererRegisterOptions).then(() => {
      return;
    });
  }

  public unregister(registererUnregisterOptions?: RegistererUnregisterOptions): Promise<void> {
    this.logger.log(`[${this.id}] Unregistering UserAgent...`);
    this.registerRequested = false;

    if (!this.registerer) {
      return Promise.resolve();
    }

    return this.registerer.unregister(registererUnregisterOptions).then(() => {
      return;
    });
  }

  public call(
    destination: string,
    inviterOptions?: InviterOptions,
    inviterInviteOptions?: InviterInviteOptions
  ): Promise<void> {
    this.logger.log(`[${this.id}] Beginning Session...`);

    if (this.session) {
      return Promise.reject(new Error(`Session already exists.`));
    }

    const target = UserAgent.makeURI(destination);
    if (!target) {
      return Promise.reject(new Error(`Failed to create a valid URI from "${destination}"`));
    }

    let line = this.getLine(this.curLineNumber);
    line.target = target;

    if (!inviterOptions) {
      inviterOptions = {};
    }
    if (!inviterOptions.sessionDescriptionHandlerOptions) {
      inviterOptions.sessionDescriptionHandlerOptions = {};
    }
    if (!inviterOptions.sessionDescriptionHandlerOptions.constraints) {
      inviterOptions.sessionDescriptionHandlerOptions.constraints = this.constraints;
    }

    const inviter = new Inviter(this.userAgent, target, inviterOptions);

    return this.sendInvite(inviter, inviterOptions, inviterInviteOptions).then(() => {
      return;
    });
  }

  public hangup(): Promise<void> {
    this.logger.log(`[${this.id}] Hangup...`);
    return this.terminate();
  }

  public answer(invitationAcceptOptions?: InvitationAcceptOptions): Promise<void> {
    this.logger.log(`[${this.id}] Accepting Invitation...`);

    if (!this.session) {
      return Promise.reject(new Error(`Session does not exist.`));
    }

    if (!(this.session instanceof Invitation)) {
      return Promise.reject(new Error(`Session not instance of Invitation.`));
    }

    if (!invitationAcceptOptions) {
      invitationAcceptOptions = {};
    }
    if (!invitationAcceptOptions.sessionDescriptionHandlerOptions) {
      invitationAcceptOptions.sessionDescriptionHandlerOptions = {};
    }
    if (!invitationAcceptOptions.sessionDescriptionHandlerOptions.constraints) {
      invitationAcceptOptions.sessionDescriptionHandlerOptions.constraints = this.constraints;
    }

    return this.session.accept(invitationAcceptOptions);
  }

  public decline(): Promise<void> {
    this.logger.log(`[${this.id}] rejecting Invitation...`);

    if (!this.session) {
      return Promise.reject(new Error(`Session does not exist.`));
    }

    if (!(this.session instanceof Invitation)) {
      return Promise.reject(new Error(`Session not instance of Invitation.`));
    }

    return this.session.reject();
  }

  public hold(): Promise<void> {
    this.logger.log(`[${this.id}] holding session...`);
    return this.setLineHold(true, this.curLineNumber);
  }

  public unhold(): Promise<void> {
    this.logger.log(`[${this.id}] unholding session...`);
    return this.setLineHold(false, this.curLineNumber);
  }

  public isHeld(): boolean {
    const line = this.getLine(this.curLineNumber);
    return line.held;
  }

  public mute(): void {
    this.logger.log(`[${this.id}] disabling media tracks...`);
    this.setLineMute(true, this.curLineNumber);
  }

  public unmute(): void {
    this.logger.log(`[${this.id}] enabling media tracks...`);
    this.setLineMute(false, this.curLineNumber);
  }

  public isMuted(): boolean {
    const line = this.getLine(this.curLineNumber);
    return line.muted;
  }

  public sendDTMF(tone: string): Promise<void> {
    this.logger.log(`[${this.id}] sending DTMF...`);

    if (!/^[0-9A-D#*,]$/.exec(tone)) {
      return Promise.reject(new Error(`Invalid DTMF tone.`));
    }

    if (!this.session) {
      return Promise.reject(new Error(`Session does not exist.`));
    }

    this.logger.log(`[${this.id}] Sending DTMF tone: ${tone}`);
    const dtmf = tone;
    const duration = 2000;
    const body = {
      contentDisposition: `render`,
      contentType: `application/dtmf-relay`,
      content: `Signal=` + dtmf + `\r\nDuration=` + duration
    };
    const requestOptions = { body };

    return this.session.info({ requestOptions }).then(() => {
      return;
    });
  }

  public message(destination: string, message: string): Promise<void> {
    this.logger.log(`[${this.id}] sending message...`);

    const target = UserAgent.makeURI(destination);
    if (!target) {
      return Promise.reject(new Error(`Failed to create a valid URI from "${destination}"`));
    }
    return new Messager(this.userAgent, target, message).message();
  }

  private get constraints(): { audio: boolean; video: boolean } {
    let constraints = { audio: true, video: false }; // default to audio only calls
    if (this.options.media?.constraints) {
      constraints = { ...this.options.media.constraints };
    }
    return constraints;
  }

  private attemptReconnection(reconnectionAttempt = 1): void {
    const reconnectionAttempts = this.options.reconnectionAttempts || 3;
    const reconnectionDelay = this.options.reconnectionDelay || 4;

    if (!this.connectRequested) {
      this.logger.log(`[${this.id}] Reconnection not currently desired`);
      return;
    }

    if (this.attemptingReconnection) {
      this.logger.log(`[${this.id}] Reconnection attempt already in progress`);
    }

    if (reconnectionAttempt > reconnectionAttempts) {
      this.logger.log(`[${this.id}] Reconnection maximum attempts reached`);
      return;
    }

    if (reconnectionAttempt === 1) {
      this.logger.log(`[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - trying`);
    } else {
      this.logger.log(
        `[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - trying in ${reconnectionDelay} seconds`
      );
    }

    this.attemptingReconnection = true;

    setTimeout(
      () => {
        if (!this.connectRequested) {
          this.logger.log(
            `[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - aborted`
          );
          this.attemptingReconnection = false;
          return;
        }
        this.userAgent
          .reconnect()
          .then(() => {
            this.logger.log(
              `[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - succeeded`
            );
            this.attemptingReconnection = false;
          })
          .catch((error: Error) => {
            this.logger.log(
              `[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - failed`
            );
            this.logger.error(error.message);
            this.attemptingReconnection = false;
            this.attemptReconnection(++reconnectionAttempt);
          });
      },
      reconnectionAttempt === 1 ? 0 : reconnectionDelay * 1000
    );
  }

  private cleanupMedia(): void {
    if (this.options.media) {
      if (this.options.media.local1) {
        if (this.options.media.local1.video) {
          this.options.media.local1.video.srcObject = null;
          this.options.media.local1.video.pause();
        }
      }
      if (this.options.media.remote1) {
        if (this.options.media.remote1.audio) {
          this.options.media.remote1.audio.srcObject = null;
          this.options.media.remote1.audio.pause();
        }
        if (this.options.media.remote1.video) {
          this.options.media.remote1.video.srcObject = null;
          this.options.media.remote1.video.pause();
        }
      }
      if (this.options.media.local2) {
        if (this.options.media.local2.video) {
          this.options.media.local2.video.srcObject = null;
          this.options.media.local2.video.pause();
        }
      }
      if (this.options.media.remote2) {
        if (this.options.media.remote2.audio) {
          this.options.media.remote2.audio.srcObject = null;
          this.options.media.remote2.audio.pause();
        }
        if (this.options.media.remote2.video) {
          this.options.media.remote2.video.srcObject = null;
          this.options.media.remote2.video.pause();
        }
      }
    }
  }

  private enableReceiverTracks(enable: boolean, lineNumber: number): void {
    const line = this.getLine(lineNumber);
    const session : Session = line.session;

    if (!session) {
      throw new Error(`Session does not exist.`);
    }

    const sessionDescriptionHandler = session.sessionDescriptionHandler;
    if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
      throw new Error(`Session's session description handler not instance of SessionDescriptionHandler.`);
    }

    const peerConnection = sessionDescriptionHandler.peerConnection;
    if (!peerConnection) {
      throw new Error(`Peer connection closed.`);
    }

    peerConnection.getReceivers().forEach((receiver) => {      
      if (receiver.track) {
        receiver.track.enabled = enable;
      }
    });
  }

  private enableSenderTracks(enable: boolean, lineNumber: number): void {
    const line = this.getLine(lineNumber);
    const session : Session = line.session;

    if (!session) {
      throw new Error(`Session does not exist.`);
    }

    const sessionDescriptionHandler = session.sessionDescriptionHandler;
    if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
      throw new Error(`Session's session description handler not instance of SessionDescriptionHandler.`);
    }

    const peerConnection = sessionDescriptionHandler.peerConnection;
    if (!peerConnection) {
      throw new Error(`Peer connection closed.`);
    }

    peerConnection.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.enabled = enable;
      }
    });
  }

  private initSession(session: Session, referralInviterOptions?: InviterOptions): void {
    this.session = session;

    if (this.delegate && this.delegate.onCallCreated) {
      this.delegate.onCallCreated();
    }

    this.session.stateChange.addListener((state: SessionState) => {
      if (this.session !== session) {
        return;
      }
      this.logger.log(`[${this.id}] session state changed to ${state}`);
      switch (state) {
        case SessionState.Initial:
          break;
        case SessionState.Establishing:
          break;
        case SessionState.Established:
          this.setupLocalMedia();
          this.setupRemoteMedia();
          if (this.delegate && this.delegate.onCallAnswered) {
            this.delegate.onCallAnswered();
          }
          if (this.curLineNumber == 2) {
            this.makeConference();            
          }
          break;
        case SessionState.Terminating:
        case SessionState.Terminated:
          this.session = undefined;
          if (!this.isExistSession()) {
            this.cleanupMedia();
          }
          if (this.delegate && this.delegate.onCallHangup) {
            this.delegate.onCallHangup();
          }
          break;
        default:
          throw new Error(`Unknown session state.`);
      }
    });

    this.session.delegate = {
      onBye: (bye: Bye): void => {
        for(let i = 0; i < 2; i++) {
          const line = this.getLine(i);
          if (line.session) {
            const id: string = line.session.id;
            const byeId: string = bye.request.callId;            
            if (id.toLowerCase().includes(byeId.toLowerCase())) {
              this.curLineNumber = i;
            }
          }
        }
      },
      onInfo: (info: Info): void => {
        if (this.delegate?.onCallDTMFReceived === undefined) {
          info.reject();
          return;
        }

        const contentType = info.request.getHeader(`content-type`);
        if (!contentType || !/^application\/dtmf-relay/i.exec(contentType)) {
          info.reject();
          return;
        }

        const body = info.request.body.split(`\r\n`, 2);
        if (body.length !== 2) {
          info.reject();
          return;
        }

        let tone: string | undefined;
        const toneRegExp = /^(Signal\s*?=\s*?)([0-9A-D#*]{1})(\s)?.*/;
        if (toneRegExp.test(body[0])) {
          tone = body[0].replace(toneRegExp, `$2`);
        }
        if (!tone) {
          info.reject();
          return;
        }

        let duration: number | undefined;
        const durationRegExp = /^(Duration\s?=\s?)([0-9]{1,4})(\s)?.*/;
        if (durationRegExp.test(body[1])) {
          duration = parseInt(body[1].replace(durationRegExp, `$2`), 10);
        }
        if (!duration) {
          info.reject();
          return;
        }

        info
          .accept()
          .then(() => {
            if (this.delegate && this.delegate.onCallDTMFReceived) {
              if (!tone || !duration) {
                throw new Error(`Tone or duration undefined.`);
              }
              this.delegate.onCallDTMFReceived(tone, duration);
            }
          })
          .catch((error: Error) => {
            this.logger.error(error.message);
          });
      },
      onRefer: (referral: Referral): void => {
        referral
          .accept()
          .then(() => this.sendInvite(referral.makeInviter(referralInviterOptions), referralInviterOptions))
          .catch((error: Error) => {
            this.logger.error(error.message);
          });
      }
    };
  }

  private sendInvite(
    inviter: Inviter,
    inviterOptions?: InviterOptions,
    inviterInviteOptions?: InviterInviteOptions
  ): Promise<void> {
    this.initSession(inviter, inviterOptions);

    return inviter.invite(inviterInviteOptions).then(() => {
      this.logger.log(`[${this.id}] sent INVITE`);
    });
  }

  private setupLocalMedia(): void {
    if (!this.session) {
      throw new Error(`Session does not exist.`);
    }

    let mediaElement;

    if  (this.curLineNumber == 0) {
      mediaElement = this.options.media?.local1?.video;
    } 
    else {
      mediaElement = this.options.media?.local2?.video;
    }

    if (mediaElement) {
      const localStream = this.localMediaStream;
      if (!localStream) {
        throw new Error(`Local media stream undefiend.`);
      }
      mediaElement.srcObject = localStream;
      mediaElement.volume = 0;
      mediaElement.play().catch((error: Error) => {
        this.logger.error(`[${this.id}] Failed to play local media`);
        this.logger.error(error.message);
      });
    }
  }

  private setupRemoteMedia(): void {    
    if (!this.session) {
      throw new Error(`Session does not exist.`);
    }

    let mediaElement;

    if (this.curLineNumber == 0) {
      mediaElement = this.options.media?.remote1?.video || this.options.media?.remote1?.audio;
    }
    else {
      mediaElement = this.options.media?.remote2?.video || this.options.media?.remote2?.audio;
    }

    if (mediaElement) {
      const remoteStream = this.remoteMediaStream;
      if (!remoteStream) {
        throw new Error(`Remote media stream undefiend.`);
      }
      mediaElement.autoplay = true; // Safari hack, because you cannot call .play() from a non user action
      mediaElement.srcObject = remoteStream;
      mediaElement.play().catch((error: Error) => {
        this.logger.error(`[${this.id}] Failed to play remote media`);
        this.logger.error(error.message);
      });
      remoteStream.onaddtrack = (): void => {
        this.logger.log(`[${this.id}] Remote media onaddtrack`);
        mediaElement.load(); // Safari hack, as it doesn't work otheriwse
        mediaElement.play().catch((error: Error) => {
          this.logger.error(`[${this.id}] Failed to play remote media`);
          this.logger.error(error.message);
        });
      };
    }
  }

  private terminate(): Promise<void> {
    this.logger.log(`[${this.id}] Terminating...`);

    if (!this.session) {
      return Promise.reject(new Error(`Session does not exist.`));
    }

    switch (this.session.state) {
      case SessionState.Initial:
        if (this.session instanceof Inviter) {
          return this.session.cancel().then(() => {
            this.logger.log(`[${this.id}] Inviter never sent INVITE (canceled)`);
          });
        } else if (this.session instanceof Invitation) {
          return this.session.reject().then(() => {
            this.logger.log(`[${this.id}] Invitation rejected (sent 480)`);
          });
        } else {
          throw new Error(`Unknown session type.`);
        }
      case SessionState.Establishing:
        if (this.session instanceof Inviter) {
          return this.session.cancel().then(() => {
            this.logger.log(`[${this.id}] Inviter canceled (sent CANCEL)`);
          });
        } else if (this.session instanceof Invitation) {
          return this.session.reject().then(() => {
            this.logger.log(`[${this.id}] Invitation rejected (sent 480)`);
          });
        } else {
          throw new Error(`Unknown session type.`);
        }
      case SessionState.Established:
        return this.session.bye().then(() => {
          this.logger.log(`[${this.id}] Session ended (sent BYE)`);
        });
      case SessionState.Terminating:
        break;
      case SessionState.Terminated:
        break;
      default:
        throw new Error(`Unknown state`);
    }
    this.logger.log(`[${this.id}] Terminating in state ${this.session.state}, no action taken`);
    return Promise.resolve();
  }

  async initTransfer(lineNumber: number): Promise<void> {
    this.logger.log(`[${this.id}] Changing Lines...`);

    if (lineNumber === this.curLineNumber) {
      return Promise.resolve();
    }

    if (this.session) {
      if (this.session.state === SessionState.Established) {
        await this.setLineHold(true, this.curLineNumber);
      }
    }

    this.curLineNumber = lineNumber;

    if (this.session) {
      if (this.session.state === SessionState.Established) {
        await this.setLineHold(false, this.curLineNumber);
      }
    }

    if (this.delegate && this.delegate.onLineChanged) {
      this.delegate.onLineChanged();
    }

    return Promise.resolve();
  }

  public completeTransferA(): Promise<OutgoingReferRequest> {
    this.logger.log(`[${this.id}] Completing Attended Transfer...`);

    if (!this.session && this.session.state !== SessionState.Established) {
      return Promise.reject(new Error(`Session does not exists.`));
    }

    const oldLine = this.getLine(this.curLineNumber === 0 ? 1 : 0);
    const oldSession = oldLine.session;

    if (!oldSession) {
      return Promise.reject(new Error(`Old Session does not exists.`));
    }

    const curLine = this.getLine(this.curLineNumber);
    if (!curLine.session) {
      return Promise.reject(new Error(`Current session does not exists.`));
    }

    return oldSession.refer(curLine.target);
  }

  public completeTransferB(destination: string): Promise<OutgoingReferRequest> {
    this.logger.log(`[${this.id}] Completing Blind Transfer...`);

    const target = UserAgent.makeURI(destination);

    if (!this.session && this.session.state !== SessionState.Established) {
      return Promise.reject(new Error(`Session does not exists.`));
    }

    const oldLine = this.getLine(this.curLineNumber);
    const oldSession = oldLine.session;

    if (!oldSession) {
      return Promise.reject(new Error(`Old Session does not exists.`));
    }

    return oldSession.refer(target);
  }

  async initConference(lineNumber: number): Promise<void> {
    this.logger.log(`[${this.id}] Changing Lines...`);

    if (lineNumber === this.curLineNumber) {
      return Promise.resolve();
    }

    if (this.session) {
      if (this.session.state === SessionState.Established) {
        await this.setLineHold(true, this.curLineNumber);
      }
    }

    this.firstLineNumber = this.curLineNumber;
    this.secondLineNumber = lineNumber;

    this.curLineNumber = lineNumber;

    if (this.delegate && this.delegate.onLineChanged) {
      this.delegate.onLineChanged();
    }

    return Promise.resolve();
  }

  async completeConference(
    confDestination: string,
    inviterOptions?: InviterOptions,
    inviterInviteOptions?: InviterInviteOptions
  ): Promise<void> {
    this.logger.log(`[${this.id}] Completing Transfer...`);

    this.confTarget = UserAgent.makeURI(confDestination);

    const twoLine = this.getLine(this.secondLineNumber);
    const twoSession = twoLine.session;

    if (!twoSession) {
      return Promise.reject(new Error(`Old Session does not exists.`));
    }

    if (twoSession) {
      if (twoSession.state === SessionState.Established) {
        await this.setLineHold(true, this.secondLineNumber);
      }
    }

    this.curLineNumber = 2;

    if (!inviterOptions) {
      inviterOptions = {};
    }
    if (!inviterOptions.sessionDescriptionHandlerOptions) {
      inviterOptions.sessionDescriptionHandlerOptions = {};
    }
    if (!inviterOptions.sessionDescriptionHandlerOptions.constraints) {
      inviterOptions.sessionDescriptionHandlerOptions.constraints = this.constraints;
    }

    const newInviter = new Inviter(this.userAgent, this.confTarget, inviterOptions);

    this.sendInvite(newInviter, inviterOptions, inviterInviteOptions).then(() => {
      return;
    });
  }

  private makeConference() : void {
    let id : string;

    const oneline = this.getLine(this.firstLineNumber);

    id = oneline.session.id;

    let oneTarget : URI = this.confTarget;
    oneTarget.setHeader("Replaces", id.substring(0, id.length - 10));
    oneTarget.setHeader("from-tag", id.substring(id.length - 10));

    oneline.session.refer(oneTarget);

    const twoline = this.getLine(this.secondLineNumber);

    id = twoline.session.id;

    let twoTarget : URI = this.confTarget;
    twoTarget.setHeader("Replaces", id.substring(0, id.length - 10));
    twoTarget.setHeader("from-tag", id.substring(id.length - 10));

    twoline.session.refer(twoTarget);
  }

  public terminateConference(): Promise<void> {
    this.logger.log(`[${this.id}] Terminate conference...`);
    this.curLineNumber = 2;
    return this.terminate();
  }

  async changeLine(lineNumber: number): Promise<void> {
    this.logger.log(`[${this.id}] Changing Lines...`);

    if (lineNumber === this.curLineNumber) {
      return Promise.resolve();
    }

    if (this.session) {
      if (this.session.state === SessionState.Established) {
        await this.setLineHold(true, this.curLineNumber);
      }
    }

    this.curLineNumber = lineNumber;

    if (this.session) {
      if (this.session.state === SessionState.Established) {
        await this.setLineHold(false, this.curLineNumber);
      }
    }

    if (this.delegate && this.delegate.onLineChanged) {
      this.delegate.onLineChanged();
    }

    return Promise.resolve();
  }

  get curLineNumber(): number {
    return this._curLineNumber;
  }

  set curLineNumber(value: number) {
    this._curLineNumber = value;
  }

  get firstLineNumber(): number {
    return this._firstLineNumber;
  }

  set firstLineNumber(value: number) {
    this._firstLineNumber = value;
  }

  get secondLineNumber(): number {
    return this._secondLineNumber;
  }

  set secondLineNumber(value: number) {
    this._secondLineNumber = value;
  }

  get session(): Session {
    if (this.curLineNumber > 3 || this.curLineNumber < 0) {
      return undefined;
    }
    const curLineSession: LineSession = this.lineSessions[this.curLineNumber];
    return curLineSession.session;
  }

  set session(curSession: Session) {
    if (this.curLineNumber > 2 || this.curLineNumber < 0) {
      return
    }
    this.lineSessions[this.curLineNumber].session = curSession;
  }

  private getLine(lineId: number): LineSession {
    if (lineId > 2 || lineId < 0) {
      return undefined;
    }
    const curLine: LineSession = this.lineSessions[lineId];
    return curLine;
  }

  private setLineMute(mute: boolean, lineNumber: number): Promise<void> {
    const line = this.getLine(lineNumber);
    const lineSession = line.session;

    if (!lineSession) {
      return Promise.reject(new Error(`Session does not exist.`));
    }

    if (lineSession.state !== SessionState.Established) {
      return Promise.reject(new Error(`[${this.id}] An established session is required to enable/disable media tracks`));
    }

    line.muted = mute;
    this.enableSenderTracks(!line.held && !line.muted, lineNumber);
  }

  private setLineHold(hold: boolean, lineNumber: number): Promise<void> {
    const line = this.getLine(lineNumber);
    const lineSession = line.session;

    if (!lineSession) {
      return Promise.reject(new Error(`Session does not exist.`));
    }

    const session = lineSession;
    if (line.held === hold) {
      return Promise.resolve();
    }

    const sessionDescriptionHandler = lineSession.sessionDescriptionHandler;
    if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
      throw new Error(`Session's session description handler not instance of SessionDescriptionHandler.`);
    }

    const options: SessionInviteOptions = {
      requestDelegate: {
        onAccept: (): void => {
          line.held = hold;
          this.enableReceiverTracks(!line.held, lineNumber);
          this.enableSenderTracks(!line.held && !line.muted, lineNumber);
          if (this.delegate && this.delegate.onCallHold) {
            this.delegate.onCallHold(line.held, lineNumber);
          }
        },
        onReject: (): void => {
          this.logger.warn(`[${this.id}] re-invite request was rejected`);
          this.enableReceiverTracks(!line.held, lineNumber);
          this.enableSenderTracks(!line.held && !line.muted, lineNumber);
          if (this.delegate && this.delegate.onCallHold) {
            this.delegate.onCallHold(line.held, lineNumber);
          }
        }
      }
    };

    const sessionDescriptionHandlerOptions = session.sessionDescriptionHandlerOptionsReInvite as SessionDescriptionHandlerOptions;
    sessionDescriptionHandlerOptions.hold = hold;
    session.sessionDescriptionHandlerOptionsReInvite = sessionDescriptionHandlerOptions;

    return lineSession
      .invite(options)
      .then(() => {
        this.setupRemoteMedia();
        this.enableReceiverTracks(!hold, lineNumber);
        this.enableSenderTracks(!hold && !line.muted, lineNumber);
      })
      .catch((error: Error) => {
        if (error instanceof RequestPendingError) {
          this.logger.error(`[${this.id}] A hold request is already in progress.`);
        }
        throw error;
      });
  }

  public isEstablished(): boolean {
    if (!this.session) {
      return false;
    }
    return this.session.state === SessionState.Established;
  }

  public isExistSession(): boolean {
    this.lineSessions.forEach((item, index) => {
      if (item.session !== undefined) {
        return false;
      }
    })
    return true;
  }
}