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
  var RESERVED_HOLDERS, escapeRegExp, fillPattern, getKwdsInRoute, getObjVals, getRedirectParamList, getTargetUrl, getUrlFromClipboard, getUrlValues, hasReservedWord, hasUndefinedWord, hostReg, i18n, ipReg, isHost, isIp, isKwdsUniq, isPath, isProtocol, isRegValid, namedParam, parseQs, pathReg, protocols, queryStrReg, route2reg, splatParam, urlComponentReg;
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
  protocols = ['*', 'https', 'http'];
  isProtocol = function(protocol) {
    return indexOf.call(protocols, protocol) >= 0;
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

  /**
   * parse a query string into a key-value object
   * @param  {String} qs
   * @return {Object}
   */
  parseQs = function(url) {
    var params;
    params = {};
    url.replace(/^[^?]+\?/, '').replace(/#[^#]*/, '').split('&').forEach(function(el) {
      var e, error, parts, ref;
      parts = el.split('=');
      parts[1] = (ref = parts[1]) != null ? ref : '';
      try {
        return params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
      } catch (error) {
        e = error;
        return params[parts[0]] = parts[1];
      }
    });
    return params;
  };
  getKwdsInRoute = function(router) {
    return [].concat(router.params, getObjVals(route.qsParams));
  };
  namedParam = /\{(\(\?)?(\w+)\}/g;
  splatParam = /\{(\*\w+)\}/g;
  escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
  queryStrReg = /([\w%\[\]]+)=\{([\w]+)\}/g;

  /**
   * convert a url pattern to a regexp
   * @param  {String} route url pattern
   * @return {Object}
   *                 {
   *                    reg: regexp string can match an url
   *                    hasQs: has named params in query string
   *                    params: two array of var name of each named param in path an querystring
   *                 }
   */
  route2reg = function(route) {
    var params, part, parts, reg, result;
    result = {};
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
    reg = '^' + part + '(?:\\?([\\s\\S]*))?$';
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
   * @param  {Object}  res result returned by route2reg
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
  urlComponentReg = /^(\w+):\/\/([^\/]+)\/([^?]+)?(\?(.*))?$/;

  /**
   * get a key-value object from the url which match the pattern
   * @param  {Object} r   {reg: ..., params: ''} from route2reg
   * @param  {String} url a real url that match that pattern
   * @return {Object}
   */
  getUrlValues = function(r, url) {
    var e, error, j, k, l, len, len1, matchs, qsParams, ref, ref1, res, v;
    res = {};
    try {
      matchs = (new RegExp(r.reg)).exec(url);
    } catch (error) {
      e = error;
      matchs = '';
    }
    if (!matchs) {
      return null;
    }
    ref = r.params;
    for (k = j = 0, len = ref.length; j < len; k = ++j) {
      v = ref[k];
      res[v] = matchs[k + 1] || '';
    }
    if (r.hasQs) {
      qsParams = parseQs(url);
      ref1 = r.qsParams;
      for (k = l = 0, len1 = ref1.length; l < len1; k = ++l) {
        v = ref1[k];
        res[v] = qsParams[k] || '';
      }
    }
    matchs = urlComponentReg.exec(url);
    res.p = RegExp.$1;
    res.h = RegExp.$2;
    res.m = res.h.split('.').slice(-2).join('.');
    res.r = RegExp.$3;
    res.q = RegExp.$5;
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
  getRedirectParamList = function(url) {
    return url.match(/\{([\w]+)\}/g).map(function(v) {
      return v.slice(1, -1);
    });
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
    res = [];
    sample = getRedirectParamList(url);
    for (j = 0, len = sample.length; j < len; j++) {
      v = sample[j];
      if (indexOf.call(params, v) < 0) {
        res.push(v);
      }
    }
    if (res.length) {
      return res;
    }
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
    path.replace(/\{(\w+)\}/g, function($0, $1) {
      var ref, val;
      val = (ref = data[$2]) != null ? ref : '';
      return encodeURIComponent(val);
    });
    qs = qs && qs.replace(/\{(\w+)\}/g, function($0, $1) {
      var ref, val;
      val = (ref = data[$2]) != null ? ref : '';
      return encodeURIComponent(val).replace('%20', '+');
    });
    return path + qs;
  };

  /**
   * get target url
   * @param  {String} route   url pattern to match a url
   * @param  {String} pattern url pattern that to get a new url
   * @param  {String} url     a real url that match route
   * @return {String}         converted url
   */
  getTargetUrl = function(route, pattern, url) {
    var params, r;
    r = route2reg(route);
    params = getUrlValues(r, url);
    if (!params) {
      return '';
    }
    return fillPattern(pattern, params);
  };
  return {
    isIp: isIp,
    isHost: isHost,
    isPath: isPath,
    isProtocol: isProtocol,
    i18n: i18n,
    route2reg: route2reg,
    getUrlValues: getUrlValues,
    isRegValid: isRegValid,
    hasUndefinedWord: hasUndefinedWord,
    hasReservedWord: hasReservedWord,
    getTargetUrl: getTargetUrl,
    getUrlFromClipboard: getUrlFromClipboard
  };
});


//# sourceMappingURL=utils.js.map
