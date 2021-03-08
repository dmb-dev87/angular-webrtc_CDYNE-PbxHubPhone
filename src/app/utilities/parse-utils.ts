import * as xml2js from 'xml2js';
import { MessageHistory } from '../models/messagehistory';
import { PhoneState } from '../models/phonestate';
import { PhoneUser } from '../models/phoneuser';

export function parseContact(data: any): any {
	const arr = [];
	const parser = new xml2js.Parser({
		trim: true,
		explicitArray: true
	});
	parser.parseString(data, (err, result: string) => {
		const envelope = result['s:Envelope'];
		const body = envelope['s:Body'];
		const dirRes = body[0].User_GetDirectoryResponse;
		const dirResult = dirRes[0].User_GetDirectoryResult;
		const aPbxUserList = dirResult[0]['a:PbxUserLite'];
		for(const k in aPbxUserList) {
			const item = aPbxUserList[k];
			arr.push({
				extension: item['a:Extension'][0],
				firstName: item['a:FirstName'][0],
				lastName: item['a:LastName'][0],
        state: item['a:State'][0]
			});
		}
	});
	return arr;
}

export function parseState(data: any): any {
	let phoneState: PhoneState = new PhoneState;
  const parser = new xml2js.Parser({
    time: true,
    explicitArray: true
  });

  parser.parseString(data, (err, result: string) => {
    const envelope = result['s:Envelope'];
    const body = envelope['s:Body'];
    const response = body[0].User_GetStateResponse;
    const res = response[0].User_GetStateResult;
    const stateData = res[0];
    phoneState.extension = stateData['a:Extension'][0];
    phoneState.firstName = stateData['a:FirstName'][0];
    phoneState.lastName = stateData['a:LastName'][0];
    phoneState.state = stateData['a:State'][0];
  })

  return phoneState;
}

export function parseDnd(data: any): any {
	let dndResult: any;
	const parser = new xml2js.Parser({
		trim: true,
		explicitArray: true
	});

	parser.parseString(data, (err, result: string) => {
		const envelope = result['s:Envelope'];
		const body = envelope['s:Body'];
		const dndRes = body[0].ToggleDndResponse;
		dndResult = dndRes[0].ToggleDndResult;
	})

	return dndResult[0];
}

export function parseWebRtcDemo(data: any): any {
	let phoneUser: PhoneUser = new PhoneUser;

  const parser = new xml2js.Parser({
    trim: true,
    explicitArray: true
  });

  parser.parseString(data, (err, result) => {
    const envelope = result['s:Envelope'];
    const body = envelope['s:Body'];
    const response = body[0].WebRtcDemoResponse;
    const res = response[0].WebRtcDemoResult;
    const userData = res[0];
    phoneUser.authName = userData['a:authName'][0];
    phoneUser.authPassword = userData['a:authPassword'][0];
    phoneUser.clientId = userData['a:clientId'][0];
    phoneUser.displayName = userData['a:displayName'][0];
    phoneUser.extenNumber = userData['a:extenNumber'][0];
  })

  return phoneUser;
}

export function parseMessageHistories(data: any): Array<MessageHistory> {
	const offset = new Date().getTimezoneOffset();
	const histories: Array<MessageHistory> = [];
	const parser = new xml2js.Parser({
		trim: true,
		explicitArray: true
	});
	parser.parseString(data, (err, result: string) => {
		const envelope = result['s:Envelope'];
		const body = envelope['s:Body'];
		const dirRes = body[0].Message_GetMessagesResponse;
		const dirResult = dirRes[0].Message_GetMessagesResult;
		const aMessageList = dirResult[0]['a:SipMessage'] !== undefined? dirResult[0]['a:SipMessage'] : [];
		for(const k in aMessageList) {
			const item = aMessageList[k];
			const datetime =new Date(item['a:Entrydate'][0]);
			datetime.setTime(datetime.getTime() - 60000 * (datetime.getTimezoneOffset()));
			histories.push({
				body: item['a:Body'][0],
				datetime: datetime,
				messageId: item['a:messageid'][0],
				sent: item['a:sent'][0] === 'true'
			});
		}
	});
	return histories;
}

export function parseMessageContact(data: any): any {
	const arr = [];
	const parser = new xml2js.Parser({
		trim: true,
		explicitArray: true
	});
	parser.parseString(data, (err, result: string) => {
		const envelope = result['s:Envelope'];
		const body = envelope['s:Body'];
		const dirRes = body[0].Message_GetActiveConversationsResponse;
		const dirResult = dirRes[0].Message_GetActiveConversationsResult;
		const aPbxUserList = dirResult[0]['a:PbxUserLite'];
		for(const k in aPbxUserList) {
			const item = aPbxUserList[k];
			arr.push({
				extension: item['a:Extension'][0],
				firstName: item['a:FirstName'][0],
				lastName: item['a:LastName'][0]
			});
		}
	});
	return arr;
}