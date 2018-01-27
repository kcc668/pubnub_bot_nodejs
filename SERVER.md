//var ks={`${app}`:{PKEY,SKEY}}

export default (request) => {

	var pubnub = require("pubnub");

	var uuid=request.params.uuid;
	var {PKEY,SKEY}=ks[request.message.app]||{};

	if(PKEY) pubnub.publish({channel: PKEY, message: request});
	if(SKEY){
		request.message.SKEY = SKEY;
		pubnub.publish({channel: uuid, message: request.message});
	}
	return request.ok();
}
