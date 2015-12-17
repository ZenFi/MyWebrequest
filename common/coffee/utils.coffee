((root, factory)->
  if typeof define is 'function' and (define.amd or define.cmd)
    define ->
      factory root
  else if typeof exports is 'object'
    module.exports = factory root
  else
    root.utils = factory root
  return
)(this, (root) ->

  # check an ip addr. eg. 102.33.22.1
  ipReg = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])$/
  isIp = (ip)->
    ipReg.test ip

  # check a host. eg. google.com, dev.fb.com, etc.
  hostReg = /^(\*((\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,4})?|([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,4})$/
  isHost = (host)->
    hostReg.test host

  # check a path. eg. path/subpath/file.html?querystring
  pathReg = /^[a-z0-9-_\+=&%@!\.,\*\?\|~\/]+$/i
  isPath = (path)->
    pathReg.test path

  protocols = [ '*', 'https', 'http']
  isProtocol = (protocol)->
    protocol in protocols

  ###*
   * get i18n text
   * @param  {String} msgid text label id
   * @return {String}
  ###
  i18n = (msgid)->
    chrome.i18n.getMessage msgid

  ###*
   * get object's values into an array
   * @param  {Object} o
   * @return {Array}
  ###
  getObjVals = (o)->
    res = []
    for own k, v of o
      res.push v
    res
  
  ###*
   * GET url info url the clipboard, returns {protocol, host, path}
   * @param  {Event} e  paste event
   * @return {Object}
  ###
  getUrlFromClipboard = (e)->
    result = {}
    url = e.originalEvent.clipboardData.getData 'text/plain'
    return result unless url

    i = url.indexOf '://'
    url = '*://' + url if i is -1

    return result unless url.match /^([a-z]+|\*):\/\/([^\/]+)(\/.*)?$/i
    # extract regexp results right now or things changed
    result.protocol = RegExp.$1.toLowerCase()
    result.host = RegExp.$2
    result.path = RegExp.$3
    result

  ###*
   * parse a query string into a key-value object
   * @param  {String} qs
   * @return {Object}
  ###
  parseQs = (url)->
    params = {}
    url
    .replace /^[^?]+\?/, ''
    .replace /#[^#]*/, ''
    .split '&'
    .forEach (el)->
      parts = el.split '='
      parts[1] = parts[1] ? ''
      try
        params[ decodeURIComponent(parts[0]) ] = decodeURIComponent( parts[1] )
      catch e
        params[ parts[0] ] = parts[1]
    params
  
  # get keywords list(array) in route object
  getKwdsInRoute = (router)->
    [].concat router.params, getObjVals route.qsParams


  # // http://www.baidu.com/{g}-{d}/{*abc}?abc={name}&youse={bcsd}
  # // http://www.baidu.com/{g}-{d}/{*abc}?abc={name}&youse={bcsd}
  # optionalParam = /\((.*?)\)/g
  namedParam    = /\{(\(\?)?(\w+)\}/g
  splatParam    = /\{(\*\w+)\}/g
  escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g
  queryStrReg   = /([\w%\[\]]+)=\{([\w]+)\}/g
  ###*
   * convert a url pattern to a regexp
   * @param  {String} route url pattern
   * @return {Object}
   *                 {
   *                    reg: regexp string can match an url
   *                    hasQs: has named params in query string
   *                    params: two array of var name of each named param in path an querystring
   *                 }
  ###
  route2reg = (route)->
    result = {}
    parts = route.split '?'
    # route contains more than one ?
    if parts.length > 2 then return result
    result.hasQs = parts.length is 2
    params = []
    
    # hand named params in path
    part = parts[0].replace escapeRegExp, '\\$&'
    # .replace optionalParam, '(?:$1)?'
    .replace namedParam, (match, $1, $2)->
      params.push $2
      if $1 then match else '([^/?]+)'
    .replace splatParam, (match, $1)->
      params.push $1
      '([^?]*?)'
    reg = '^' + part + '(?:\\?([\\s\\S]*))?$'
    result.reg = reg
    result.params = params

    # hand named params in query string
    params = {}
    if result.hasQs
      parts[1].replace queryStrReg, ($0, $1, $2)->
        try
          $1 = decodeURIComponent $1
        catch e
        params[ $1 ] = $2
    result.qsParams = params
    result.hasQs = !!Object.keys(params).length
    result

  # pre-defined placeholders
  RESERVED_HOLDERS = ['p', 'h', 'm', 'r', 'q']
  # have reserved word in url pattern
  # return a reserved words list that has been miss used.
  hasReservedWord = (router)->
    params = getKwdsInRoute router
    res = []
    for v in RESERVED_HOLDERS
      if v in params or "%#{v}" in params or "=#{v}" in params
        res.push v
    # remove duplicated names
    res = res.filter (v, k)->
      k isnt res.indexOf v
    return res if res.length

  ###*
   * check the whether router's keywords are unique
   * return undefined if valid
   * return an array of duplicated names if found in params
   * @param  {Object}  res result returned by route2reg
   * @return {Boolean|Array|undefined}
  ###
  isKwdsUniq = (router)->
    params = getKwdsInRoute router
    res = []
    res = params.filter (v, k)-> k isnt params.indexOf v
    if res.length
      res


  # reg to match protocol, host, path, query
  urlComponentReg = /^(\w+):\/\/([^/]+)\/([^?]+)?(\?(.*))?$/
  ###*
   * get a key-value object from the url which match the pattern
   * @param  {Object} r   {reg: ..., params: ''} from route2reg
   * @param  {String} url a real url that match that pattern
   * @return {Object}
  ###
  getUrlValues = (r, url)->
    res = {}
    try
      matchs = (new RegExp(r.reg)).exec url
    catch e
      matchs = ''
    return null unless matchs
    # get path values
    for v, k in r.params
      res[ v ] = matchs[ k + 1 ] or ''

    # get query string values
    if r.hasQs
      qsParams = parseQs url
      for v, k in r.qsParams
        res[ v ] = qsParams[ k ] or ''

    matchs = urlComponentReg.exec url
    # keep protocol
    res.p = RegExp.$1
    # keep host
    res.h = RegExp.$2
    # main domain
    res.m = res.h.split('.').slice(-2).join '.'
    # path
    res.r = RegExp.$3
    # query string without question mark
    res.q = RegExp.$5
    res

  # return undefined if valid or a error message
  isRegValid = (reg)->
    try
      new RegExp reg
      return
    catch e
      return e.message

  # get a list from redirect to url, eg. http://{sub}.github.com/{%name}/{=protol}
  # %name mean encodeURIComponent name
  # =name mean decodeURIComponent name
  getRedirectParamList = (url)->
    url.match(/\{([\w]+)\}/g).map (v)-> v.slice 1, -1

  ###*
   * return undefined if no undefined word, or a list contains undefined words
   * @param  {Object}  router a defined word list
   * @param  {String}  url   a url pattern that use words in refer
   * @return {Array|undefined}
  ###
  hasUndefinedWord = (router, url)->
    params = getKwdsInRoute router
    res = []
    sample = getRedirectParamList url
    for v in sample
      res.push v if v not in params
    if res.length
      res


  # fill a pattern with data
  fillPattern = (pattern, data)->
    i = pattern.indexOf '?'
    path = pattern
    qs = ''
    if i isnt -1
      path = pattern.substr 0, i
      qs = pattern.substr i
    
    path.replace /\{(\w+)\}/g, ($0, $1)->
      val = data[ $2 ] ? ''
      encodeURIComponent val
    qs = qs and qs.replace /\{(\w+)\}/g, ($0, $1)->
      val = data[ $2 ] ? ''
      encodeURIComponent(val).replace '%20', '+'
    path + qs

  ###*
   * get target url
   * @param  {String} route   url pattern to match a url
   * @param  {String} pattern url pattern that to get a new url
   * @param  {String} url     a real url that match route
   * @return {String}         converted url
  ###
  getTargetUrl = (route, pattern, url)->
    r = route2reg route
    params = getUrlValues r, url
    return '' unless params
    fillPattern pattern, params



  return {
    isIp                : isIp
    isHost              : isHost
    isPath              : isPath
    isProtocol          : isProtocol
    i18n                : i18n
    route2reg           : route2reg
    getUrlValues         : getUrlValues
    isRegValid          : isRegValid
    hasUndefinedWord    : hasUndefinedWord
    hasReservedWord     : hasReservedWord
    getTargetUrl        : getTargetUrl
    getUrlFromClipboard : getUrlFromClipboard
  }
)