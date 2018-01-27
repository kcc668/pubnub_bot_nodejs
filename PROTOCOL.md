# DECLARATION

Protocol Specification V1

```
call_link:function(callMsg:{callbackId,callTime,callData}){
}
reponse_link:function(callbackMsg:{responseId,responseData}){
}

```

```
.callHandler(handlerName, callData, funtion(callbackMsg){
	//
});

.registerHandler(handlerName, handler(callData){
	//
});
```

# DATA STRUCTURE

```
callMsg:{
	callbackId
	callTime
	callData //Object/Array/null, no primitive
}

callbackMsg:{
	responseId //link to callbackId
	responseData // JSON Object/Array/null.  suggest not primitive
}
```

{"handlerName":"external","callbackId":"1234"}
