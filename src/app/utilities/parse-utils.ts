import * as xml2js from 'xml2js';

export function parseContact(data): any {
	const arr = [];
	const parser = new xml2js.Parser({
		trim: true,
		explicitArray: true
	});
	parser.parseString(data, (err, result) => {
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
				lastName: item['a:LastName'][0]
			});
		}
	});
	return arr;
}

export function parseDnd(data): any {
	let dndResult;
	const parser = new xml2js.Parser({
		trim: true,
		explicitArray: true
	});

	parser.parseString(data, (err, result) => {
		const envelope = result['s:Envelope'];
		const body = envelope['s:Body'];
		const dndRes = body[0].ToggleDndResponse;
		dndResult = dndRes[0].ToggleDndResult;
	})

	return dndResult[0];
}