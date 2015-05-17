// Generated by CoffeeScript 1.9.2
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
  var escapeRegExp, fillPattern, getConfig, getLocal, getRedirectParamList, getSwitch, getTargetUrl, getUrlParam, hasReservedWord, hasUndefinedWord, hostReg, i18n, ipReg, isHost, isIp, isPath, isProtocol, isRegValid, namedParam, optionalParam, pathReg, protocols, route2reg, setConfig, setLocal, setSwitch, splatParam;
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
    return -1 !== protocols.indexOf(protocol);
  };
  optionalParam = /\((.*?)\)/g;
  namedParam = /(\(\?)?:\w+/g;
  splatParam = /\*\w+/g;
  escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  /**
   * convert a url pattern to a regexp
   * @param  {[type]} route [description]
   * @return {[type]}       [description]
   */
  route2reg = function(route) {
    var params, reg;
    params = [];
    route = route.replace(escapeRegExp, '\\$&').replace(optionalParam, '(?:$1)?').replace(namedParam, function(match, optional) {
      params.push(match.replace(/^[^:]*?:/, ''));
      if (optional) {
        return match;
      } else {
        return '([^/?]+)';
      }
    }).replace(splatParam, function(match) {
      params.push(match.replace(/^[^*]*?\*/, ''));
      return '([^?]*?)';
    });
    reg = '^' + route + '(?:\\?([\\s\\S]*))?$';
    return {
      reg: reg,
      params: params
    };
  };

  /**
   * get a key-value object from the url which match the pattern
   * @param  {Object} r   {reg: ..., params: ''} from route2reg
   * @param  {String} url a real url that match that pattern
   * @return {Object}
   */
  getUrlParam = function(r, url) {
    var e, i, k, len, matchs, ref, res, v;
    res = {};
    try {
      matchs = (new RegExp(r.reg)).exec(url);
    } catch (_error) {
      e = _error;
      matchs = '';
    }
    if (!matchs) {
      return null;
    }
    ref = r.params;
    for (k = i = 0, len = ref.length; i < len; k = ++i) {
      v = ref[k];
      res[v] = matchs[k + 1] || '';
    }
    matchs = /^(\w+):\/\/([^\/]+)\/?/.exec(url);
    res.p = matchs[1];
    res.h = matchs[2];
    res.m = res.h.split('.').slice(-2).join('.');
    return res;
  };
  isRegValid = function(reg) {
    var e;
    try {
      return new RegExp(reg);
    } catch (_error) {
      e = _error;
      return e.message;
    }
  };
  getRedirectParamList = function(url) {
    return url.match(/\{([%=\w]+)\}/g).map(function(p) {
      return p.trim().slice(1, -1);
    });
  };

  /**
   * return undefined if no undefined word, or a list contains undefined words
   * @param  {Object}  refer a defined word list
   * @param  {String}  url   a url pattern that use words in refer
   * @return {Array|undefined}
   */
  hasUndefinedWord = function(refer, url) {
    var i, len, res, sample, v;
    res = [];
    sample = getRedirectParamList(url);
    for (i = 0, len = sample.length; i < len; i++) {
      v = sample[i];
      if (-1 !== ['%', '='].indexOf(v.charAt(0))) {
        v = v.slice(1);
      }
      if (-1 === refer.indexOf(v)) {
        res.push(v);
      }
    }
    if (res.length) {
      return res;
    } else {

    }
  };
  hasReservedWord = function(params) {
    var i, len, res, reserved, v;
    reserved = ['p', 'h', 'm'];
    res = [];
    for (i = 0, len = reserved.length; i < len; i++) {
      v = reserved[i];
      if (!(-1 === params.indexOf(v) && -1 === params.indexOf("%" + v) && -1 === params.indexOf("=" + v))) {
        res.push(v);
      }
    }
    res = res.filter(function(v, k) {
      return k === res.indexOf(v);
    });
    if (res.length) {
      return reteurn(res);
    }
  };
  fillPattern = function(pattern, data) {
    return pattern.replace(/\{([%=\w]+)\}/g, function($0, $1) {
      var e, prefix, ref, ref1, v;
      if (-1 === ['%', '='].indexOf($1.charAt(0))) {
        return (ref = data[$1]) != null ? ref : '';
      } else {
        prefix = $1.charAt(0);
        v = (ref1 = data[$1.slice(1)]) != null ? ref1 : '';
        try {
          if (prefix === '%') {
            v = encodeURIComponent(v);
          } else {
            v = decodeURIComponent(v);
          }
        } catch (_error) {
          e = _error;
        }
        return v;
      }
    });
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
    params = getUrlParam(r, url);
    if (!params) {
      return '';
    }
    return fillPattern(pattern, params);
  };
  getSwitch = function(cat) {
    var onoff;
    onoff = JSON.parse(localStorage.getItem('onoff') || '{}');
    return !!onoff[cat];
  };
  setSwitch = function(cat, isOn) {
    var onoff;
    onoff = JSON.parse(localStorage.getItem('onoff') || '{}');
    onoff[cat] = !!isOn;
    localStorage.setItem('onoff', JSON.stringify(onoff));
  };
  getConfig = function(key) {
    var config;
    config = JSON.parse(localStorage.getItem('config') || '{}');
    return config[key];
  };
  setConfig = function(key, val) {
    var config;
    config = JSON.parse(localStorage.getItem('config') || '{}');
    config[key] = val;
    localStorage.setItem('config', JSON.stringify(config));
  };
  getLocal = function(key, expectFormat) {
    switch (expectFormat) {
      case 'object':
      case 'o':
        return JSON.parse(localStorage.getItem(key) || '{}');
      case 'array':
      case 'a':
        return JSON.parse(localStorage.getItem(key) || '[]');
      default:
        return localStorage.getItem(key);
    }
  };
  setLocal = function(key, val) {
    if (val != null) {
      localStorage.setItem(key, JSON.stringify(val));
    } else {
      localStorage.removeItem(key);
    }
  };
  i18n = function(msgid) {
    return chrome.i18n.getMessage(msgid);
  };
  return {
    getLocal: getLocal,
    setLocal: setLocal,
    getSwitch: getSwitch,
    setSwitch: setSwitch,
    getConfig: getConfig,
    setConfig: setConfig,
    isIp: isIp,
    isHost: isHost,
    isPath: isPath,
    isProtocol: isProtocol,
    i18n: i18n,
    route2reg: route2reg,
    getUrlParam: getUrlParam,
    isRegValid: isRegValid,
    hasUndefinedWord: hasUndefinedWord,
    hasReservedWord: hasReservedWord,
    getTargetUrl: getTargetUrl
  };
});


//# sourceMappingURL=utils.js.map
