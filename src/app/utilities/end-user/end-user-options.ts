import { UserAgentOptions } from 'sip.js';
import { EndUserDelegate } from './end-user-delegate';

export interface EndUserMedia {
  constraints?: EndUserMediaConstraints;

  local1?: EndUserMediaLocal;

  local2?: EndUserMediaLocal;

  remote1?: EndUserMediaRemote;

  remote2?: EndUserMediaRemote;
}

export interface EndUserMediaConstraints {
  audio: boolean;
  video: boolean;
}

export interface EndUserMediaLocal {
  audio?: HTMLAudioElement;
  video?: HTMLVideoElement;
}

export interface EndUserMediaRemote {
  audio?: HTMLAudioElement;
  video?: HTMLVideoElement;
}

export interface EndUserOptions {
  aor?: string;

  delegate?: EndUserDelegate;

  media?: EndUserMedia;

  reconnectionAttempts?: number;

  reconnectionDelay?: number;

  userAgentOptions?: UserAgentOptions;
}
