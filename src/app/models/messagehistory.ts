export class MessageRecord {
  sent: boolean;
  body: string;
  datetime: string;
  messageId: number;
}

export class MessageHistory {
  extension: string;
  records: Array<MessageRecord>;
}