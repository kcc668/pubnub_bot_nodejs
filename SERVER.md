var ks={"app":{"PKEY":"PKEY","SKEY":"SKEY"}};

export default (request) => {
	var pubnub = require("pubnub");
	var {PKEY,SKEY}=ks[request.message.app]||{};
	if (PKEY) pubnub.publish({channel: PKEY, message: request});
	if (SKEY) {
		request.message.SKEY = SKEY;
		pubnub.publish({channel: request.params.uuid, message: request.message});
	}
	return request.ok();
}
