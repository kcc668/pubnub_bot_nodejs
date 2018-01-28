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

var PubNubCls = require('pubnub');//ES5

var pubnub_bot = new PubNubCls({ subscribeKey: SKEY_BOT, publishKey: PKEY_BOT });
var pubnub_svr=null;

var my_uuid = _Storage.getItemSync(bot_id +'_' + 'uuid');
if(!my_uuid){
	my_uuid = pubnub_bot.getUUID();
	_Storage.setItemSync(bot_id +'_' + 'uuid',my_uuid);
}else{
	//use previous to save devices
	pubnub_bot.setUUID(my_uuid);
	//pubnub_svr.setUUID(my_uuid);
}

/////////////////////////////////

//TODO
//function BridgeCls(){
//this.callHandler=
//this.registerHandler=
//}
//var gBridge=new BridgeCls(...)
var g_handler_a={
};

pubnub_bot.subscribe({ channels: [ 'PUBLIC',//no use
	my_uuid//for SKEY back
] });

pubnub_bot.addListener({
	message: function(m) {
		var msg=m.message||{};
		var SKEY=msg.SKEY;
		if(SKEY){
			if(!SKEY_SVR){
				SKEY_SVR=SKEY;
			}
			if(SKEY!=SKEY_SVR){
				console.log('SKEY changed, exit and wait for next round');
				process.exit();
			}
			if(!pubnub_svr){
				console.log('SKEY Update:',m);
				pubnub_svr = new PubNubCls({
					subscribeKey: SKEY_SVR,
				});
				pubnub_svr.setUUID(my_uuid);
				pubnub_svr.addListener({   
					message: function(m) {
						//TODO gBridge
						var {handlerName,callbackId,callData} = m.message;
						var handlerFunc = g_handler_a[handlerName];
						if(handlerFunc){
							//setTimeout(()=>{
								var callbackData = handlerFunc(callData,m.message,m);
								if(callbackData){
									//callHandler _me2remote
									console.log('TODO callback the data');
		//var alive = '' + new Date();
		//pubnub_bot.fire
		//({
		//	message: { app, bot_id, SKEY:SKEY_SVR,handlerName:'SignIn' },
		//	channel: ???,
		//	sendByPost: true, // true to send via post
		//}).then((response) => {
		//	console.log('my_uuid=',my_uuid,alive)
		//	setTimeout(function(){
		//		IntervalSignIn(g_time_for_interval)
		//	},g_time_for_interval)
		//}).catch((error) => {
		//	console.log('error:',error)
		//	setTimeout(function(){
		//		IntervalSignIn(g_time_for_interval)
		//	},g_time_for_interval)
		//});
								}
							//},1);
						}else{
							console.log('TODO server message:',m);
						}
					},
					status: function(s) { console.log('svr status:',s); }
				});
				pubnub_svr.subscribe({ channels: [my_uuid], });
			}
		}else{
			console.log('TODO message:',m);
		}
	},
	//presence: function(p) { console.log('TODO presence:',p); },
	status: function(s) { console.log('bot status:',s); }
});

/////////////////////////////// INTERVALLY SIGNIN
var g_time_for_interval=0;
function IntervalSignIn(time_for_interval){
	g_time_for_interval=time_for_interval;
	if(g_time_for_interval>0){
		var alive = '' + new Date();
		pubnub_bot.fire
		({
			message: { app, bot_id, /*my_uuid, */SKEY:SKEY_SVR,handlerName:'SignIn' },
			channel: 'PUBLIC',
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

/////////////////////////////// REGISTER HANDLER

//_me2remote(callbackId,handlerName,data){}
//_remote2me:
//if(msg.responseId){
//}else{if(msg.handlerName){
//handlerFunc(msg.data, function(responseData){
//var callbackResponseId = msg.callbackId
//_me2remote({responseId:callbackResponseId,responseData})
//})
//}
g_handler_a['external']=function(callData,callMsg,pubnubMsg){
	console.log('TODO external',callData,callMsg);
};
//gBridge.registerHandler('external',({callbackId,data})=>{
//	//invoke the cmd
//	var s = exec(data.cmd);
//	var responseId=callbackId;
//	var responseData={s};
//	gBridge.callHandler('external_callback',{responseId,responseData});
//});

