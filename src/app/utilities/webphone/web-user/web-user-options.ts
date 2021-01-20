import { UserAgentOptions } from 'sip.js';
import { WebUserDelegate } from './web-user-delegate';

/**
 * Media for {@link WebUserOptions}.
 * @public
 */
export interface WebUserMedia {
  /**
   * Offer/Answer constraints determine if audio and/or video are utilized.
   * If not specified, only audio is utilized (audio is true, video is false).
   * @remarks
   * Constraints are used when creating local media stream.
   * If undefined, defaults to audio true and video false.
   * If audio and video are false, media stream will have no tracks.
   */
  constraints?: WebUserMediaConstraints;

  /** HTML elements for local media streams. */
  local?: WebUserMediaLocal;

  /** Local HTML media elements. */
  remote?: WebUserMediaRemote;
}

/**
 * Constraints for {@link WebUserMedia}.
 * @public
 */
export interface WebUserMediaConstraints {
  /** If true, offer and answer to send and receive audio. */
  audio: boolean;
  /** If true, offer and answer to send and receive video. */
  video: boolean;
}

/**
 * Local media elements for {@link WebUserMedia}.
 * @public
 */
export interface WebUserMediaLocal {
  /** The local video media stream is attached to this element. */
  video?: HTMLVideoElement;
}

/**
 * Remote media elements for {@link WebUserMedia}.
 * @public
 */
export interface WebUserMediaRemote {
  /** The remote audio media stream is attached to this element. */
  audio?: HTMLAudioElement;
  /** The remote video media stream is attached to this element. */
  video?: HTMLVideoElement;
}

/**
 * Options for {@link WebUser}.
 * @public
 */
export interface WebUserOptions {
  /**
   * User's SIP Address of Record (AOR).
   * @remarks
   * The AOR is registered to receive incoming calls.
   * If not specified, a random anonymous address is created for the user.
   */
  aor?: string;

  /**
   * Delegate for WebUser.
   */
  delegate?: WebUserDelegate;

  /**
   * Media options.
   */
  media?: WebUserMedia;

  /**
   * Maximum number of times to attempt to reconnection.
   * @remarks
   * When the transport connection is lost (WebSocket disconnects),
   * reconnection will be attempted immediately. If that fails,
   * reconnection will be attempted again when the browser indicates
   * the application has come online. See:
   * https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine
   * @defaultValue 3
   */
  reconnectionAttempts?: number;

  /**
   * Seconds to wait between reconnection attempts.
   * @defaultValue 4
   */
  reconnectionDelay?: number;

  /**
   * Options for UserAgent.
   */
  userAgentOptions?: UserAgentOptions;
}
