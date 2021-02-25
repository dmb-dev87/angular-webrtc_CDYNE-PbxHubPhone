export class MessageRecord {      
  constructor(
    body: string,
    datetime: string,
    messageId: number,
    sent: boolean) {}
}

export class MessageHistory {
  public extension: string;
  public records: Array<MessageRecord>;
}