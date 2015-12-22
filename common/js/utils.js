// Generated by CoffeeScript 1.10.0
var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  hasProp = {}.hasOwnProperty;

(function(root, factory) {
  if (typeof define === 'function' && (define.amd || define.cmd)) {
    define(function() {
      return factory(root);
    });
  } else if (typeof exports === 'object') {
    module.exports = factory(root);
  } else {
    root.utils = factory(root);
  }
})(this, function(root) {
  var RESERVED_HOLDERS, escapeRegExp, fillPattern, getKwdsInRoute, getObjVals, getQs, getRedirectParamList, getRouter, getTargetUrl, getUrlFromClipboard, getUrlValues, hasReservedWord, hasUndefinedWord, hostReg, i18n, ipReg, isHost, isIp, isKwdsUniq, isPath, isProtocol, isRedirectRuleValid, isRegValid, isRouterStrValid, isUrl, namedParam, parseQs, pathReg, protocols, queryStrReg, splatParam, toQueryString, urlComponentReg;
  protocols = ['*', 'https', 'http'];
  isProtocol = function(protocol) {
    return indexOf.call(protocols, protocol) >= 0;
  };
  ipReg = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])$/;
  isIp = function(ip) {
    return ipReg.test(ip);
  };
  hostReg = /^(\*((\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,4})?|([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,4})$/;
  isHost = function(host) {
    return hostReg.test(host);
  };
  pathReg = /^[a-z0-9-_\+=&%@!\.,\*\?\|~\/]+$/i;
  isPath = function(path) {
    return pathReg.test(path);
  };
  urlComponentReg = /^(\*|\w+):\/\/([^\/]+)\/([^?]+)?(\?(.*))?$/;
  isUrl = function(url) {
    var matches, path;
    matches = urlComponentReg.exec(url);
    if (!matches) {
      return false;
    }
    if (!isProtocol(matches[1])) {
      return false;
    }
    if (!(isHost(matches[2]) || isIp(matches[2]))) {
      return false;
    }
    path = matches[3] + matches[4];
    if (!isPath(path)) {
      return false;
    }
    return true;
  };

  /**
   * get i18n text
   * @param  {String} msgid text label id
   * @return {String}
   */
  i18n = function(msgid) {
    return chrome.i18n.getMessage(msgid);
  };

  /**
   * get object's values into an array
   * @param  {Object} o
   * @return {Array}
   */
  getObjVals = function(o) {
    var k, res, v;
    res = [];
    for (k in o) {
      if (!hasProp.call(o, k)) continue;
      v = o[k];
      res.push(v);
    }
    return res;
  };
  isRegValid = function(reg) {
    var e, error;
    try {
      new RegExp(reg);
    } catch (error) {
      e = error;
      return e.message;
    }
  };

  /**
   * GET url info url the clipboard, returns {protocol, host, path}
   * @param  {Event} e  paste event
   * @return {Object}
   */
  getUrlFromClipboard = function(e) {
    var i, result, url;
    result = {};
    url = e.originalEvent.clipboardData.getData('text/plain');
    if (!url) {
      return result;
    }
    i = url.indexOf('://');
    if (i === -1) {
      url = '*://' + url;
    }
    if (!url.match(/^([a-z]+|\*):\/\/([^\/]+)(\/.*)?$/i)) {
      return result;
    }
    result.protocol = RegExp.$1.toLowerCase();
    result.host = RegExp.$2;
    result.path = RegExp.$3;
    return result;
  };
  getQs = function(url) {
    return ("" + url).replace(/^[^?]+\?/, '').replace(/#[^#]*/, '');
  };

  /**
   * parse a query string into a key-value object
   * @param  {String} qs
   * @return {Object}
   */
  parseQs = function(qs) {
    var canDecode, params;
    params = {};
    canDecode = true;
    qs.split('&').forEach(function(el) {
      var e, error, k, parts, ref, v;
      parts = el.split('=');
      k = parts[0];
      v = (ref = parts[1]) != null ? ref : '';
      if (canDecode) {
        try {
          k = decodeURIComponent(k);
          v = decodeURIComponent(v);
        } catch (error) {
          e = error;
          canDecode = false;
        }
      }
      if (params[k] != null) {
        if (!Array.isArray(params[k])) {
          params[k] = [params[k]];
        }
        return params[k].push(v);
      } else {
        return params[k] = v;
      }
    });
    return params;
  };

  /**
   * convert key-val into an querysting: encode(key)=encode(val)
   * if val is an array, there will be an auto conversion
   * @param  {String} key
   * @param  {String|Array} val
   * @return {String}
   */
  toQueryString = function(key, val) {
    var e, error;
    if (Array.isArray(val)) {
      try {
        key = decodeURIComponent(key);
        key = key.replace(/[]$/, '') + '[]';
        key = encodeURIComponent(key).replace('%20', '+');
      } catch (error) {
        e = error;
      }
      return ("" + key) + val.map(function(el) {
        return encodeURIComponent(el).replace('%20', '+');
      }).join("&" + key + "=");
    } else {
      val = encodeURIComponent(val).replace('%20', '+');
      return key + "=" + val;
    }
  };
  getKwdsInRoute = function(router) {
    return [].concat(router.params, RESERVED_HOLDERS, getObjVals(router.qsParams));
  };

  /**
   * is route string valid
   * return false if invalid
   * validate string like {abc}.user.com/{hous}/d.html?hah
   * @param  {String}  route
   * @return {Boolean}
   */
  isRouterStrValid = function(route) {
    var mathes, n, path, protocol, qs;
    mathes = urlComponentReg.exec(route);
    protocol = matches[1];
    path = mathes[2] + matches[3];
    qs = matches[5];
    console.log('test path format:' + path);
    if (!/^(\{\w+\})*(\.\w+){2,}\/(\{\w+\}|[a-z0-9-_\+=&%@!\.,\*\?\|~\/])*(\{\*\w+\})?$/.test(path)) {
      return false;
    }
    console.log('test splat kwd  in the middle of the string');
    if (/(\{\*\w+\}).+$/.test(path)) {
      return false;
    }
    if (qs) {
      console.log('test qs format');
      if (!/^(([\w_\+%@!\.,\*\?\|~\/]+=\{\w+\})|([\w_\+%@!\.,\*\?\|~\/]+=[\w_\+%@!\.,\*\?\|~\/]+)|&)*$/.test(qs)) {
        return false;
      }
      console.log('test qs {named} format');
      if (/\{\*\w+\}/.test(qs) || /[?&]\{\w+\}/.test(qs) || /\{\w+\}(?!&|$)/.test(qs)) {
        return false;
      }
    }
    n = route.replace(/\{\*?\w+\}/g, 'xxx');
    return isUrl(n);
  };
  namedParam = /\{(\(\?)?(\w+)\}/g;
  splatParam = /\{(\*\w+)\}/g;
  escapeRegExp = /[\-\[\]+?.,\\\^$|#\s]/g;
  queryStrReg = /([\w_\+%@!\.,\*\?\|~\/]+)=\{(\w+)\}/g;

  /**
   * convert a url pattern to a regexp
   * @param  {String} route url pattern
   * @return {Object}
   *                 {
   *                    url: match url, which url will be captured
   *                    reg: regexp string can match an url
   *                    hasQs: has named params in query string
   *                    params: two array of var name of each named param in path an querystring
   *                 }
   */
  getRouter = function(route) {
    var params, part, parts, protocol, reg, result, url;
    result = {};
    protocol = route.match(/^([\w\*]+)\:\/\//);
    protocol = protocol ? protocol[1] : '*';
    url = protocol + '://';
    protocol = protocol.replace(escapeRegExp, '(?:\\$&)');
    route = route.replace(/^([\w\*]+)\:\/\//, '');
    url += route.replace(/^[^\/]*(\.|\{\w+\}|\w+)*\.{\w+\}/, '*').replace(/\?.*$/, '*').replace(/\{\w+\}.*$/, '*');
    result.url = url;
    parts = route.split('?');
    if (parts.length > 2) {
      return result;
    }
    result.hasQs = parts.length === 2;
    params = [];
    part = parts[0].replace(escapeRegExp, '\\$&').replace(namedParam, function(match, $1, $2) {
      params.push($2);
      if ($1) {
        return match;
      } else {
        return '([^/?]+)';
      }
    }).replace(splatParam, function(match, $1) {
      params.push($1);
      return '([^?]*?)';
    });
    reg = "^" + protocol + ":\/\/" + part + "(?:\\?([\\s\\S]*))?$";
    result.reg = reg;
    result.params = params;
    params = {};
    if (result.hasQs) {
      parts[1].replace(queryStrReg, function($0, $1, $2) {
        var e, error;
        try {
          $1 = decodeURIComponent($1);
        } catch (error) {
          e = error;
        }
        return params[$1] = $2;
      });
    }
    result.qsParams = params;
    result.hasQs = !!Object.keys(params).length;
    return result;
  };
  RESERVED_HOLDERS = ['p', 'h', 'm', 'r', 'q'];
  hasReservedWord = function(router) {
    var j, len, params, ref, ref1, res, v;
    params = getKwdsInRoute(router);
    res = [];
    for (j = 0, len = RESERVED_HOLDERS.length; j < len; j++) {
      v = RESERVED_HOLDERS[j];
      if (indexOf.call(params, v) >= 0 || (ref = "%" + v, indexOf.call(params, ref) >= 0) || (ref1 = "=" + v, indexOf.call(params, ref1) >= 0)) {
        res.push(v);
      }
    }
    res = res.filter(function(v, k) {
      return k !== res.indexOf(v);
    });
    if (res.length) {
      return res;
    }
  };

  /**
   * check the whether router's keywords are unique
   * return undefined if valid
   * return an array of duplicated names if found in params
   * @param  {Object}  res result returned by getRouter
   * @return {Boolean|Array|undefined}
   */
  isKwdsUniq = function(router) {
    var params, res;
    params = getKwdsInRoute(router);
    res = [];
    res = params.filter(function(v, k) {
      return k !== params.indexOf(v);
    });
    if (res.length) {
      return res;
    }
  };
  getRedirectParamList = function(url) {
    var matches;
    matches = url.match(/\{(\w+)\}/g) || [];
    return matches.map(function(v) {
      return v.slice(1, -1);
    });
  };

  /**
   * redirect rule valid
   * @param  {String}  redirectUrl
   * @return {Boolean}
   */
  isRedirectRuleValid = function(redirectUrl) {
    if (!redirectUrl) {
      return false;
    }
    if (!getRedirectParamList(redirectUrl).length) {
      return false;
    }
    return isUrl(redirectUrl.replace(/^\{\w+\}/, '*').replace(/^\{\w+\}/g, 'xxx'));
  };

  /**
   * return undefined if no undefined word, or a list contains undefined words
   * @param  {Object}  router a defined word list
   * @param  {String}  url   a url pattern that use words in refer
   * @return {Array|undefined}
   */
  hasUndefinedWord = function(router, url) {
    var j, len, params, res, sample, v;
    params = getKwdsInRoute(router);
    console.log('router keywords: ' + params.join(','));
    res = [];
    sample = getRedirectParamList(url);
    console.log('redirected kwds: ' + sample.join(','));
    for (j = 0, len = sample.length; j < len; j++) {
      v = sample[j];
      if (indexOf.call(params, v) < 0) {
        res.push(v);
      }
    }
    console.log('result: ' + res.join(','));
    if (res.length) {
      return res;
    }
  };

  /**
   * get a key-value object from the url which match the pattern
   * @param  {Object} r   {reg: ..., params: ''} from getRouter
   * @param  {String} url a real url that match that pattern
   * @return {Object}
   */
  getUrlValues = function(r, url) {
    var e, error, j, k, len, matches, qsParams, ref, ref1, res, v;
    res = {};
    try {
      matches = (new RegExp(r.reg)).exec(url);
    } catch (error) {
      e = error;
      matches = '';
    }
    if (!matches) {
      return null;
    }
    ref = r.params;
    for (k = j = 0, len = ref.length; j < len; k = ++j) {
      v = ref[k];
      res[v] = matches[k + 1] || '';
    }
    if (r.hasQs) {
      qsParams = parseQs(getQs(url));
      ref1 = r.qsParams;
      for (k in ref1) {
        if (!hasProp.call(ref1, k)) continue;
        v = ref1[k];
        res[v] = qsParams[k] || '';
      }
    }
    console.log('url values: %o', res);
    urlComponentReg.exec(url);
    res.p = RegExp.$1;
    res.h = RegExp.$2;
    res.m = res.h.split('.').slice(-2).join('.');
    res.r = RegExp.$3;
    res.q = RegExp.$5;
    return res;
  };
  fillPattern = function(pattern, data) {
    var i, path, qs;
    i = pattern.indexOf('?');
    path = pattern;
    qs = '';
    if (i !== -1) {
      path = pattern.substr(0, i);
      qs = pattern.substr(i);
    }
    path = path.replace(/\{(\w+)\}/g, function($0, $1) {
      var ref, val;
      val = (ref = data[$1]) != null ? ref : '';
      if (~val.indexOf('/')) {
        return val;
      } else {
        return encodeURIComponent(val);
      }
    });
    qs = qs && qs.replace(/([\w\%+\[\]]+)=\{(\w+)\}/g, function($0, $1, $2) {
      var ref, val;
      val = (ref = data[$2]) != null ? ref : '';
      return toQueryString($1, val);
    });
    return path + qs;
  };

  /**
   * get target url
   * @param  {Object} router   url pattern to match a url
   * @param  {String} pattern url pattern that to get a new url
   * @param  {String} url     a real url that match route
   * @return {String}         converted url
   */
  getTargetUrl = function(router, pattern, url) {
    var params;
    params = getUrlValues(router, url);
    if (!params) {
      return '';
    }
    return fillPattern(pattern, params);
  };
  return {
    isProtocol: isProtocol,
    isIp: isIp,
    isHost: isHost,
    isPath: isPath,
    isUrl: isUrl,
    i18n: i18n,
    getQs: getQs,
    parseQs: parseQs,
    isRouterStrValid: isRouterStrValid,
    getRouter: getRouter,
    getUrlValues: getUrlValues,
    isRegValid: isRegValid,
    hasUndefinedWord: hasUndefinedWord,
    hasReservedWord: hasReservedWord,
    getTargetUrl: getTargetUrl,
    getUrlFromClipboard: getUrlFromClipboard
  };
});


//# sourceMappingURL=utils.js.map
