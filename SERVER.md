var ks={"app":{"PKEY":"PKEY","SKEY":"SKEY"}};

export default (request) => {
	var pubnub = require("pubnub");
	var {PKEY,SKEY}=ks[request.message.app]||{};
	if (PKEY) pubnub.publish({channel: PKEY, message: request});
	if(request.params.uuid && SKEY && SKEY!=request.message.SKEY){
		request.message.SKEY = SKEY;
		pubnub.publish({channel: request.params.uuid, message: request.message});
	}
	return request.ok();
}

/**

export default (request) => {

  var console = require("console");
  var pubnub = require("pubnub");

  try {
    var {PKEY,SKEY}=ks[request.message.app]||{};
    if(PKEY){
        //fwd msg to the app-handler nodes
        pubnub.publish({channel: PKEY, message: request});
    }
    if(request.params.uuid && SKEY && SKEY!=request.message.SKEY){
        //answer to the caller so that it will get the SKEY to listen from the app-handler node
        request.message.SKEY = SKEY;
        pubnub.publish({channel: request.params.uuid, message: request.message});
    }
    return request.ok();
  }
  catch (e) {
      console.error("Uncaught exception:", e); 
  }
}

*/
