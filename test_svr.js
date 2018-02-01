//TODO make test_svr.htm later

function argv2o(argv,m,mm){var rt={};for(k in argv)(m=(rt[""+k]=argv[k]).match(/^(\/|--?)([a-zA-Z0-9-_]*)="?(.*)"?$/))&&(rt[m[2]]=m[3]);return rt}

var {
	persit_config,
	SKEY_SVR,PKEY_SVR,
	SKEY_BOT,PKEY_BOT,
	app,bot_id
} = argv2o(process.argv);

var _Storage=require('node-persist');
var persit_config= persit_config || {
	continuous: true,
	ttl: false,//forever...
	//expiredInterval: 24 * 3600 * 1000,
	forgiveParseErrors: true //in case parse error
};
_Storage.initSync(persit_config);

var PubNub = require('pubnub');//ES5

var pubnub_bot = new PubNub({ subscribeKey: SKEY_BOT, publishKey: PKEY_BOT });
var pubnub_svr = new PubNub({ subscribeKey: SKEY_SVR, publishKey: PKEY_SVR });

var my_uuid = _Storage.getItemSync(bot_id +'_' + 'uuid');
if(!my_uuid){
	my_uuid = pubnub_bot.getUUID();
	_Storage.setItemSync(bot_id +'_' + 'uuid',my_uuid);
}else{
	//use previous to save devices
	pubnub_bot.setUUID(my_uuid);
	pubnub_svr.setUUID(my_uuid);
}

/////////////////////////////////

pubnub_bot.subscribe({ channels: [ PKEY_SVR ] });

function TestSentBot1(m){
	//TODO make callHandler() with callback...!!! + Timeout checking....
	//TODO to test send sth to the sender
	//console.log('TODO BOT m=:',m.message);
	var target_bot_uuid = m.message.params.uuid;
	if(target_bot_uuid){
		pubnub_svr.publish
		({
			message: { handlerName:'external', callData:'env', callbackId:'T'+(new Date()).getTime() },
			channel: target_bot_uuid,
			sendByPost: true, // true to send via post
		}).then((response) => {
			console.log('    = => test msg sent bot',response)
		}).catch((error) => {
			console.log('error for sending bot:',error)
		});
	}else{
		console.log('!!! UNKNOWN BOT message.');
	}
}
pubnub_bot.addListener({
	message: function(m) {
		//TODO save the uuid for later use... and send msg from web UI later....
		if(m.message.message.responseId){
			console.log('response message:',m.message.message);
		}else{
			//console.log('DEBUG:',m.message);
			TestSentBot1(m);//just quick test
		}
	},
	//presence: function(p) { console.log('TODO presence:',p); },
	status: function(s) { console.log('bot status:',s); }
});

pubnub_svr.addListener({
	message: function(m) {
		console.log('TODO SVR message:',m);
	},
	//presence: function(p) { console.log('TODO presence:',p); },
	status: function(s) { console.log('bot status:',s); }
});

//setTimeout(()=>{
//	pubnub_svr.publish({channel:target_bot_uuid,message:{???}})
//},3333);

