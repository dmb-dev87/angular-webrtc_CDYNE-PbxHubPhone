export interface EndUserDelegate {
  onCallAnswered?(): void;

  onCallCreated?(): void;

  onCallReceived?(displayName: string, target: string, autoAnswer: boolean): void;

  onCallHangup?(): void;

  onCallHold?(held: boolean, lineNumber: number): void;

  onCallDTMFReceived?(tone: string, duration: number): void;

  onMessageReceived?(fromUser: string, message: string): void;

  onRegistered?(): void;

  onUnregistered?(): void;

  onServerConnect?(): void;

  onServerDisconnect?(error?: Error): void;

  onLineChanged?(lineNumber: number): void;
}
