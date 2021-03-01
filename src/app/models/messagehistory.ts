export class MessageRecord {
  public body: string;
  public datetime: string;
  public messageId: number;
  public sent: boolean;
}

export class MessageHistory {
  public extension: string;
  public records: Array<MessageRecord>;
}