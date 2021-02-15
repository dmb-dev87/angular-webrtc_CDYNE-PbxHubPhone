import { UserAgentOptions } from 'sip.js';
import { EndUserDelegate } from './end-user-delegate';

/**
 * Media for {@link EndUserOptions}.
 * @public
 */
export interface EndUserMedia {
  /**
   * Offer/Answer constraints determine if audio and/or video are utilized.
   * If not specified, only audio is utilized (audio is true, video is false).
   * @remarks
   * Constraints are used when creating local media stream.
   * If undefined, defaults to audio true and video false.
   * If audio and video are false, media stream will have no tracks.
   */
  constraints?: EndUserMediaConstraints;

  /** HTML elements for local media streams. */
  local?: EndUserMediaLocal;

  /** Local HTML media elements. */
  remote?: EndUserMediaRemote;
}

/**
 * Constraints for {@link EndUserMedia}.
 * @public
 */
export interface EndUserMediaConstraints {
  /** If true, offer and answer to send and receive audio. */
  audio: boolean;
  /** If true, offer and answer to send and receive video. */
  video: boolean;
}

/**
 * Local media elements for {@link EndUserMedia}.
 * @public
 */
export interface EndUserMediaLocal {
  /** The local audio media stream is attached to this element. */
  audio?: HTMLAudioElement;
  /** The local video media stream is attached to this element. */
  video?: HTMLVideoElement;
}

/**
 * Remote media elements for {@link EndUserMedia}.
 * @public
 */
export interface EndUserMediaRemote {
  /** The remote audio media stream is attached to this element. */
  audio?: HTMLAudioElement;
  /** The remote video media stream is attached to this element. */
  video?: HTMLVideoElement;
}

/**
 * Options for {@link EndUser}.
 * @public
 */
export interface EndUserOptions {
  /**
   * User's SIP Address of Record (AOR).
   * @remarks
   * The AOR is registered to receive incoming calls.
   * If not specified, a random anonymous address is created for the user.
   */
  aor?: string;

  /**
   * Delegate for EndUser.
   */
  delegate?: EndUserDelegate;

  /**
   * Media options.
   */
  media?: EndUserMedia;

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
