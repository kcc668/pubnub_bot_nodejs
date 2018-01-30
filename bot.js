//eg.pubnubshell:
//node bot -SKEY_BOT=$shell_pub_skey -PKEY_BOT=$shell_pub_pkey -app=$shell_pub_app_name -bot_id=$self_def_bot_id

function argv2o(argv,m,mm){var rt={};for(k in argv)(m=(rt[""+k]=argv[k]).match(/^(\/|--?)([a-zA-Z0-9-_]*)="?(.*)"?$/))&&(rt[m[2]]=m[3]);return rt}

//get config from argo
var {
	persit_config,
	SKEY_SVR,PKEY_SVR,
	SKEY_BOT,PKEY_BOT,
	app,
	bot_id//optional
} = argv2o(process.argv);

var _Storage=require('node-persist');
var persit_config= persit_config || {
	continuous: true,
	ttl: false,//forever...
	//expiredInterval: 24 * 3600 * 1000,
	forgiveParseErrors: true //in case parse error
};
_Storage.initSync(persit_config);

var PubNubCls = require('pubnub');

var pubnub_bot = new PubNubCls({ subscribeKey: SKEY_BOT, publishKey: PKEY_BOT });
var pubnub_svr = (SKEY_SVR && PKEY_SVR) ?
	new PubNubCls({ subscribeKey: SKEY_SVR, publishKey: PKEY_SVR })
	: null;

var my_uuid = _Storage.getItemSync(bot_id +'_' + 'uuid');
if(!my_uuid){
	my_uuid = pubnub_bot.getUUID();
	_Storage.setItemSync(bot_id +'_' + 'uuid',my_uuid);
}else{
	pubnub_bot.setUUID(my_uuid);
	if(pubnub_svr)
		pubnub_svr.setUUID(my_uuid);
}

/////////////////////////////////
var g_handler_a={};

var channel_uplink = 'PUBLIC';
var channel_dnlink = my_uuid;
var channel_signin = 'PUBLIC';

pubnub_bot.addListener({
	message: function(pubnubMsg) {
		var bot_msg=pubnubMsg.message||{};
		var SKEY=bot_msg.SKEY;
		if(SKEY){
			if(!SKEY_SVR){ SKEY_SVR=SKEY; }
			if(SKEY!=SKEY_SVR){ console.log('SKEY changed, exit and wait for next round'); process.exit(); }
			if(!pubnub_svr){
				console.log('SKEY Update:',pubnubMsg);
				pubnub_svr = new PubNubCls({ subscribeKey: SKEY_SVR, });
				pubnub_svr.setUUID(my_uuid);
				pubnub_svr.addListener({
					message: function(pubnubMsg) {
						/////////////////////////////// call the handler
						var {handlerName,callbackId,callData} = pubnubMsg.message;
						var handlerFunc = g_handler_a[handlerName];
						if(handlerFunc){
							var callback=null;
							if(callbackId){
								callback=function(responseData){
									pubnub_bot.fire
									({
										message: { app, bot_id, SKEY:SKEY_SVR, handlerName, responseId:callbackId, responseData },
										channel: channel_uplink,
										sendByPost: true, // true to send via post
									}).then((response) => {
										console.log('send back...',callbackId)
									}).catch((error) => {
										console.log('send back error:',error)
									});
								};
							}else{
								console.log('TODO no callbackId from svr');
							}
							handlerFunc(callData,pubnubMsg.message,pubnubMsg,callback);
						}else{
							console.log('TODO server message:',pubnubMsg);
						}
					},
					status: function(s) { console.log('pubnub_svr status:',s); }
				});
				pubnub_svr.subscribe({ channels: [my_uuid], });
			}
		}else{
			console.log('TODO message:',pubnubMsg);
		}
	},
	status: function(s) { console.log('bot status:',s); }
});

pubnub_bot.subscribe({ channels: [ channel_dnlink ] });

/////////////////////////////// set the handler
g_handler_a['external']=function(callData,callMsg,pubnubMsg,cb){
	var exec = require('child_process').exec;
	var cmd_s = ('string'==typeof callData)?callData:(callData||{}).cmd;
	console.log('cmd_s:',cmd_s);
	exec(cmd_s,function(err,stdout,stderr){
		if(cb) cb({stdout,stderr});
	});
};

/////////////////////////////// INTERVALLY SIGNIN
var g_time_for_interval=0;
function IntervalSignIn(time_for_interval){
	g_time_for_interval=time_for_interval;
	if(g_time_for_interval>0){
		var alive = '' + new Date();
		pubnub_bot.fire
		({
			message: { app, bot_id, /*my_uuid, */SKEY:SKEY_SVR,handlerName:'SignIn' },
			channel: channel_signin,
			sendByPost: true, // true to send via post
		}).then((response) => {
			console.log('my_uuid=',my_uuid,alive)
			setTimeout(function(){
				IntervalSignIn(g_time_for_interval)
			},g_time_for_interval)
		}).catch((error) => {
			console.log('error:',error)
			setTimeout(function(){
				IntervalSignIn(g_time_for_interval)
			},g_time_for_interval)
		});
	}
}
IntervalSignIn(11111);

