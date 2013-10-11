(function  () {
	var blockrule = {},
		hstsrule = {},
		referrule = {},
		logrule = {},
		logNum = 0,
		requestCache = {};

	var pattern = /^(\*|https|http):\/\/(\*((\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,4})?|([a-zA-Z0-9]+\.)+[a-zA-Z]{2,4})\/$/;

	function cloneObj (o) {
		var obj,i;
		if (Array.isArray(o)) {
			if (o.length > 1) {
				obj = [];
			} else {
				return o[0];
			}
		} else {
			obj = {};
		}
		for (i in o) {
			if (o.hasOwnProperty(i)) {
				obj[i] = o[i] instanceof Object ? cloneObj(o[i]) : o[i];
			}
		}
		return obj;
	}

	function formatQueryBody (url) {
		var obj = {},i,arr,tmp,formated = {};
		i = url.indexOf('?');
		if (i === -1) {
			return {error: 'No query data'};
		}
		url = url.substr(++i);
		obj.rawData = url;
		arr = url.split('&');
		i = arr.length;
		// obj.formatedData = {};
		try{
			while (i--) {
				tmp = arr[i].split('=');
				formated[decodeURIComponent(tmp[0])] = tmp[1] === undefined ? '' : decodeURIComponent(tmp[1]);
			}
			obj.formatedData = formated;
		} catch(e) {
			if (e instanceof URIError) {
				obj.error = 'The query string is not encoded with utf-8, this can\'t be decoded by now.';
			} else {
				obj.error = e.message;
			}
		}
		return obj;
	}

	function formatHeaders (headers) {
		var obj = {},i = headers.length;
		while (i--) {
			obj[headers[i].name] = headers[i].value;
		}
		return obj;
	}

	function blockReq (details) {
		return {cancel: true};
	}

	function hstsReq (details) {
		return {redirectUrl:details.url.replace('http://','https://')};
	}

	function modifyReferer (details) {
		var headers = details.requestHeaders,
			len = headers.length,
			type = '',
			newReferer = '';
		while (len--) {
			if (headers[len].name === 'Referer') {
				//delete referrer
				headers.splice(len,1);
				break;
			}
		}
		return {requestHeaders: headers};
	}

	function logBody (details) {
		//only post data in requestbody,get data is in url
		if (details.requestBody) {
			requestCache[details.requestId] = cloneObj(details.requestBody);
		}
	}

	function logRequest (details) {
		var id = details.requestId;
		++logNum;
		if (requestCache[id]) {
			details.requestBody = requestCache[id];
		}
		details.requestHeaders = formatHeaders(details.requestHeaders);
		details.queryBody = formatQueryBody(details.url);
		console.log('%c%d %o','color: #086', logNum, details);
		delete requestCache[id];
	}

	//execute init when browser opened
	(function init () {
		var onoff = JSON.parse(localStorage.onoff || '{}'),
			reqApi = chrome.webRequest;
		blockrule.urls = JSON.parse(localStorage.block || '[]');
		hstsrule.urls = JSON.parse(localStorage.hsts || '[]');
		referrule.urls = JSON.parse(localStorage.refer || '[]');
		logrule.urls = JSON.parse(localStorage.log || '[]');

		if (onoff.block && blockrule.urls.length) {
			reqApi.onBeforeRequest.addListener(blockReq,blockrule,['blocking']);
		} else {
			onoff.block = false;
		}

		if (onoff.hsts && hstsrule.urls.length) {
			reqApi.onBeforeRequest.addListener(hstsReq,hstsrule,['blocking']);
		} else {
			onoff.hsts = false;
		}

		if (onoff.refer && referrule.urls.length) {
			reqApi.onBeforeSendHeaders.addListener(modifyReferer,referrule,['requestHeaders','blocking']);
		} else {
			onoff.refer = false;
		}

		if (onoff.log && logrule.urls.length) {
			reqApi.onBeforeRequest.addListener(logBody,logrule,['requestBody']);
			reqApi.onSendHeaders.addListener(logRequest,logrule,['requestHeaders']);
		} else {
			onoff.log = false;
		}

		localStorage.onoff = JSON.stringify(onoff);
	})();

	window.addEventListener("storage", function  (event){
		var type = event.key,
			reqApi = chrome.webRequest,
			newData = JSON.parse(event.newValue || '[]'),
			oldData = JSON.parse(event.oldValue || '[]'),
			onoff = JSON.parse(localStorage.onoff || '{}');

		switch(type) {
			case 'block':
				blockrule.urls = newData;
				if (onoff.block) {
					reqApi.onBeforeRequest.removeListener(blockReq);
					setTimeout(function (fn,filter) {
						reqApi.onBeforeRequest.addListener(fn,filter,['blocking']);
					}, 0,blockReq,blockrule);
				}
				break;
			case 'hsts':
				hstsrule.urls = newData;
				if (onoff.hsts) {
					reqApi.onBeforeRequest.removeListener(hstsReq);
					setTimeout(function (fn,filter) {
						reqApi.onBeforeRequest.addListener(fn,filter,['blocking']);
					}, 0,hstsReq,hstsrule);
				}
				break;
			case 'refer':
				referrule.urls = newData;
				if (onoff.refer) {
					reqApi.onBeforeSendHeaders.removeListener(modifyReferer);
					setTimeout(function (fn,filter) {
						reqApi.onBeforeSendHeaders.addListener(fn,filter,['requestHeaders','blocking']);
					}, 0,modifyReferer,referrule);
				}
				break;
			case 'log':
				logrule.urls = newData;
				if (onoff.log) {
					reqApi.onBeforeRequest.removeListener(logBody);
					reqApi.onSendHeaders.removeListener(logRequest);
					setTimeout(function (fn,filter) {
						reqApi.onBeforeRequest.addListener(logBody,logrule,['requestBody']);
						reqApi.onSendHeaders.addListener(fn,filter,['requestHeaders']);
					}, 0,logRequest,logrule);
				}
				break;
			case 'onoff':
				if (newData.block !== oldData.block) {
					if (newData.block) {
						reqApi.onBeforeRequest.addListener(blockReq,blockrule,['blocking']);
						console.log('off event block on');
					} else {
						reqApi.onBeforeRequest.removeListener(blockReq);
						console.log('off event block off');
					}
				}
				if (newData.hsts !== oldData.hsts) {
					if (newData.hsts) {
						reqApi.onBeforeRequest.addListener(hstsReq,hstsrule,['blocking']);
					} else {
						reqApi.onBeforeRequest.removeListener(hstsReq);
					}
				}
				if (newData.refer !== oldData.refer) {
					if (newData.refer) {
						console.log(' event rerfer on');
						reqApi.onBeforeSendHeaders.addListener(modifyReferer,referrule,['requestHeaders','blocking']);
					} else {
						console.log(' event rerfer off');
						reqApi.onBeforeSendHeaders.removeListener(modifyReferer);
					}
				}
				if (newData.log !== oldData.log) {
					if (newData.log) {
						console.log(' event log on')
						reqApi.onBeforeRequest.addListener(logBody,logrule,['requestBody']);
						reqApi.onSendHeaders.addListener(logRequest,logrule,['requestHeaders']);
					} else {
						console.log(' event log off');
						reqApi.onBeforeRequest.removeListener(logBody);
						reqApi.onSendHeaders.removeListener(logRequest);
					}
				}
				break;
		}
	});
})()