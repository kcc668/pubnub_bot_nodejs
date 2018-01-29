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
var g_handler_a={};

pubnub_bot.subscribe({ channels: [ 'PUBLIC',//no use
	my_uuid//for SKEY back
] });

var _svr2bot=function(callMsg){
	var {handlerName,callbackId,callData} = callMsg.message;
	var handlerFunc = g_handler_a[handlerName];
	if(handlerFunc){
		var responseData=handlerFunc(callData);
		if(responseData){

		}
	}
};

pubnub_bot.addListener({
	message: function(m) {
		var msg=m.message||{};
		var SKEY=msg.SKEY;
		if(SKEY){
			if(!SKEY_SVR){ SKEY_SVR=SKEY; }
			if(SKEY!=SKEY_SVR){ console.log('SKEY changed, exit and wait for next round'); process.exit(); }
			if(!pubnub_svr){
				console.log('SKEY Update:',m);
				pubnub_svr = new PubNubCls({ subscribeKey: SKEY_SVR, });
				pubnub_svr.setUUID(my_uuid);
				pubnub_svr.addListener({
					message: function(m) {

						//_svr2bot(m.message||{});

						//TODO gBridge
						var {handlerName,callbackId,callData} = m.message;
						var handlerFunc = g_handler_a[handlerName];
						//TODO if(responseId) if responseId, means this msg is a response from the svr which responding to one of my previous call with callbackId... but for current version, the bot don't need to call out....so make it to do...
						//TODO NOTES: pubnub only support 32KB message, so if the command need big return, other solution needed, such as FTP or EMAIL to some place?
						if(handlerFunc){
							var callback=null;
							if(callbackId){
								callback=function(responseData){
									pubnub_bot.fire
									({
										message: { app, bot_id, SKEY:SKEY_SVR, handlerName, responseId:callbackId, responseData },
										channel: 'PUBLIC',//need improve later??
										sendByPost: true, // true to send via post
									}).then((response) => {
										//console.log('send back',responseData)
										console.log('send back...',callbackId)
									}).catch((error) => {
										console.log('send back error:',error)
									});
								};
							}else{
								console.log('TODO no callbackId from svr');
							}
							handlerFunc(callData,m.message,m,callback);
						}else{
							console.log('TODO server message:',m);
						}
					},
					status: function(s) { console.log('pubnub_svr status:',s); }
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

//TODO registerHandler
//gBridge.registerHandler('external',({callbackId,data})=>{

g_handler_a['external']=function(callData,callMsg,pubnubMsg,cb){
	//console.log('TODO external',callData,callMsg);
	var exec = require('child_process').exec;
	var cmd_s = ('string'==typeof callData)?callData:(callData||{}).cmd;//TODO build cmd_s if not string....?
	//var cmd_s=`${cmd} --user-data-dir=${tmpdir}/${name} . --rnd=${rnd} `+arg_rest.join(' ');
	console.log('cmd_s:',cmd_s);
	exec(cmd_s,function(err,stdout,stderr){
		if(err) { console.log('error:'+err); } console.log('stderr:'+stderr); console.log('stdout:'+stdout);//TMP DEBUG
		if(cb) cb({stdout,stderr});
	});
};

//});

