define (require)->
  utils = require 'common/js/utils'
  collection = require 'common/js/collection'
  tpl = require 'js/tpl'
  vars = require 'js/vars'

  UNION_PAGES = ['block', 'hotlink', 'hsts', 'log', 'custom']

  # check a union cat
  # union cat: block, hotlink, hsts, etc these use a common section
  isUnionCat = (cat)->
    (cat or '').replace('#', '') in UNION_PAGES

  # check whether the host won't disable qr feature
  isSafe4Qr = (cat, rule)->
    return true if cat isnt 'block'
    not utils.isSubRule rule, vars.QR_API_HOST

  ###*
   * check whether a rule is covered by a wide range rule
   * when add a block or custome rule
   * @param  {String}  rule like *://abc.com/*
   * @return {String|undefined} if no block, return undefined, or the exist rule
  ###
  isRuleExists = (rule, cat='block')->
    rules = collection.getRules cat
    for r in rules
      if utils.isSubRule r, rule
        return r

  ###*
   * toggle enable state of section of cat( category )
   * @param  {String} cat
  ###
  resetSectionCtrlsState = (cat)->
    $thead = $ '#request-settings thead'
    $tbody = $ '#request-settings tbody'
    ruleNum = $tbody.find('tr:not([nodata])').length
    $switch = $ '#request-settings .switch-input'
    switchEnabled = collection.getSwitch cat

    $switch.prop
      'checked'  : switchEnabled and !!ruleNum
      'disabled' : !ruleNum
    $('#request-settings .enable-tip').prop 'hidden', !!ruleNum
    $thead.find('input, button').prop 'disabled', !ruleNum
    $('#request-settings .rule-cunt-num').text ruleNum
    $thead.find('input').prop 'checked', ruleNum and ruleNum is $tbody.find('tr input:checked').length
    return

  # remove a rule, support multi rules
  removeRule = (cat, $trs)->
    $tbody = $ '#request-settings tbody'
    $trs = $tbody.find('input:checked').parents('tr') unless $trs
    return unless $trs.length
    
    rules = $trs.find('input').map ->
      this.value
    .get()

    isRemoveAll = rules.length is $tbody.find('tr').length
    collection.removeRule cat, rules

    $trs.addClass 'fadeOutDown'

    setTimeout ->
      do $trs.remove
      $tbody.html tpl.nodataTpl if isRemoveAll

      resetSectionCtrlsState cat
      return
    , 200

    return

  # add a rule
  addRule = (cat, rule)->
    $tbody = $ '#request-settings tbody'
    $tr = $ tpl.rulesTpl [ collection.getRule4Show(cat, rule) ]
    $tr.addClass 'new-item'

    noRule = !$tbody.find('tr:not([nodata])').length

    $tbody[ if noRule then 'html' else 'prepend' ] $tr
    # clear inputs
    $('.rule-field input').val ''

    if cat is 'custom'
      $('#custom-test-result').html ''


    collection.addRule cat, rule
    resetSectionCtrlsState cat
    setTimeout ->
      $tr.removeClass 'new-item'
      return
    , 600
    return

  # show error info in input's input tip
  showInputErrorInfo = ($input, msg)->
    $inputTip = $input.nextAll '.input-tip'
    return unless $inputTip.length
    $errorTip = $inputTip.find '.error-info'
    # clear auto hide error info timer
    clearTimeout $input.data 'tid'
    $input.data 'tid', 0
    unless $errorTip.length
      $errorTip = $ '<div/>', 'class': 'error-info'
      $inputTip.prepend $errorTip
    $errorTip.html msg
    # setTimeout ->
    $input.focus()

  # auto hide error info after 2s when keystoke
  $('.input-tip').prevAll('input').on 'keyup', ->
    $this = $ this
    $errorTip = $this.nextAll('.input-tip').find '.error-info'
    # has error tip and no timer
    if $errorTip.length and not $this.data 'tid'
      tid = setTimeout ->
        $errorTip.remove()
      , 2000
      $this.data 'tid', tid

  
  ###*
   * init section of cat( category )
   * @param  {String} cat
  ###
  initSection = (cat)->
    rules = collection.getRules4Show cat

    isCustom = cat is 'custom'
    $('#request-settings .js-custom').prop 'hidden', !isCustom
    $('#request-settings .js-not-custom').prop 'hidden', isCustom

    if isCustom and shouldShowDemoCsRule()
      setTimeout ->
        addSamleCustomRule4demo()
      , 300
    
    # flip the rules
    # make the last added be the first
    do rules.reverse
    # init section name & description
    $('#fun-name').text $("#nav a[href^=##{cat}]").text()
    $('#fun-desc').html utils.i18n "opt_#{cat}_desc"

    hasRule = !!rules.length
    isHsts = cat is 'hsts'
    if hasRule
      html = tpl.rulesTpl rules
    else
      html = tpl.nodataTpl
      collection.setSwitch cat, false
    $('#request-settings tbody').html html
    # reset controls
    resetSectionCtrlsState cat

    $('#request-settings').attr 'data-id', cat
    # focus the first input
    # stop focus on the first input
    # because once focused, an popup tip shows up, that's annoyed
    # setTimeout ->
    #   $('#request-settings').find('input:text:enabled:visible:first').focus()
    #   return
    # , 300
    # hsts has special settings
    $('#protocol').val(if isHsts then 'http' else '*').attr 'disabled', isHsts

    return


  # union cat switch input
  $('#request-settings .switch-input').on 'change', (e) ->
    cat = $('#request-settings').attr 'data-id'
    collection.setSwitch cat, @checked
    return

  # input box [host] on *enter key*
  $('#host').on 'keyup', (e) ->
    if e.keyCode is 13
      $path = $ '#path'
      if $path.val() is ''
        $path.focus()
      else
        $(this).parents('.rule-field').find('.add-rule').click()
    return

  # paste string to [host] input box
  $('#host').on 'paste', (e) ->
    url = utils.getUrlFromClipboard e
    return true unless url.protocol and utils.isProtocol url.protocol
    $('#protocol').val url.protocol if not $('#protocol').prop 'disabled'
    $('#host').val url.host
    $('#path').val url.path + url.search
    return false

  # input box [path] on enter key
  $('#path').on 'keyup', (e) ->
    if e.keyCode is 13
      $(this).parents('.rule-field').find('.add-rule').click()
      false



  # add a simple rule for block, hotlink, log, hsts
  $('.rule-field').on 'click', '.add-rule', (e) ->
    cat = $('#request-settings').attr 'data-id'
    $protocol = $ '#protocol'
    $host = $ "#host"
    $path = $ "#path"
    data =
      protocol: $protocol.val().trim()
      host: $host.val().trim().toLowerCase()
      # remove search in the path
      path: $path.val().replace(/#.*$/, '').trim()


    unless utils.isProtocol data.protocol
      showInputErrorInfo $protocol, utils.i18n 'opt_errtip_protocol'
      $protocol.focus()
      return false

    unless data.host and ( utils.isIp(data.host) or utils.isHost(data.host) )
      showInputErrorInfo $host, utils.i18n 'opt_errtip_host'
      $host.focus()
      return false

    # Path treat empty as star(*)
    data.path = '*' if data.path is ''

    unless data.path and utils.isPath data.path
      showInputErrorInfo $path, utils.i18n 'opt_errtip_path'
      $path.focus()
      return false

    rule = "#{data.protocol}://#{data.host}/#{data.path}"
    if rule.length > 500
      showInputErrorInfo $host, utils.i18n 'opt_errtip_rulelong'
      $host.focus()
      return false

    # whether rule is duplicated
    megaRule = isRuleExists rule, cat
    if megaRule?
      showInputErrorInfo $host, utils.i18n('opt_errtip_duplicate') + megaRule
      $host.focus()
      return false

    if data.host is '*'
      if ['block', 'hsts'].indexOf(cat) isnt -1
        eMsg = 'opt_errdlg_cstarqr'
      else
        eMsg = 'opt_errdlg_cstar'
    else
      # check whether the rule will disable QR feature
      eMsg = 'opt_errdlg_cqr' unless isSafe4Qr cat, rule

    if eMsg
      dialog
        title: utils.i18n 'opt_errdlg_title'
        content: utils.i18n eMsg
        cancelValue: utils.i18n 'cancel_btn'
        cancel: ->
        autofocus: false
        okValue: utils.i18n 'ok_btn'
        ok: ->
          addRule cat, rule
          return
      .showModal()
      return
    else
      addRule cat, rule
    return
    
  # delete multi rules
  $('#request-settings .multi-delete').on 'click', (e) ->
    cat = $('#request-settings').attr 'data-id'
    len = $(this).parents('table').find('tbody input:checked').length
    if len
      dialog
        title: utils.i18n 'opt_deldlg_title'
        content: utils.i18n('opt_deldlg_content').replace 'xx', len
        cancelValue: utils.i18n 'cancel_btn'
        cancel: ->
        autofocus: false
        okValue: utils.i18n 'ok_btn'
        ok: ->
          removeRule cat
          return
      .showModal()

      return
    else
      dialog
        content: utils.i18n 'opt_errtip_nochose'
      .show this
      return false

  # delete on rule
  $('#request-settings tbody').on 'click', '.delete', (e) ->
    $tr = $(this).parents 'tr'
    cat = $('#request-settings').attr 'data-id'

    removeRule cat, $tr
    return

  # check all
  $('#check-all-rules').on 'change', (e)->
    $this = $ this
    checked = $this.prop 'checked'
    $table = $this.parents '.rules'
    $table.find('tbody input[type="checkbox"]').prop 'checked', checked
    $table.find('tbody tr')[if checked then 'addClass' else 'removeClass'] 'checked'
    return

  # single rule check
  $('#request-settings tbody').on 'change', 'input[type="checkbox"]', (e)->
    $this = $ this
    $tr = $this.parents 'tr'
    $tbody = $this.parents 'tbody'
    $checkAll = $ '#check-all-rules'
    if $this.prop 'checked'
      $tr.addClass 'checked'
      if $tbody.find('tr').length is $tbody.find('input:checked').length
        $checkAll.prop 'checked', true
    else
      $tr.removeClass 'checked'
      $checkAll.prop 'checked', false
    return

  # -------------------- for custom rule inputs -------------------------
  # paste string to [custom host] input box
  $('#host-c').on 'paste', (e) ->
    uri = utils.getUrlFromClipboard e
    return true unless uri.protocol and utils.isProtocol uri.protocol
    $('#protocol-c').val uri.protocol if not $('#protocol').prop 'disabled'
    $('#host-c').val uri.raw.replace uri.protocol + '://', ''
    return false

  # focus to next
  $('#host-c').on 'keyup', (e)->
    if e.keyCode is 13
      $('#redirect-url-input').focus()
      return false
  # focus to next
  $('#redirect-url-input').on 'keyup', (e)->
    if e.keyCode is 13
      $('#test-url-input').focus()
      return false
  # focus to next
  $('#test-url-input').on 'keyup', (e)->
    if e.keyCode is 13
      $('#test-url-btn').click()
      return false


  shouldShowDemoCsRule = ->
    !collection.getConfig 'demo-custom-rule-showed'

  ###*
   * add a sample rule for user use it first time
  ###
  addSamleCustomRule4demo = ->
    router = utils.getRouter '*://www.baidu.com/s?wd={kwd}', 'https://www.google.com.hk/search?q={kwd}'
    addRule 'custom', router
    collection.setConfig 'demo-custom-rule-showed', true
    dialog
      title: utils.i18n 'opt_dlg_title'
      content: utils.i18n 'opt_custom_demotip'
      okValue: utils.i18n 'ok_btn'
      ok: ->
    .showModal()



    
  ###*
   * Test the custom rule with a real url
   * if pass return the rule object or nothing
   * @return {Object}
   *                 {
   *                    url: match url, which url will be captured used by chrome
   *                    reg: regexp string can match an url & extract params
   *                    matchUrl: match rule with placeholder, used by extension
   *                    redirectUrl: redirect rule with placeholder
   *                    hasQs: has named params in query string
   *                    params: two array of var name of each named param in path an querystring
   *                 }
  ###
  checkCustomRule = ->
    $protocol = $ '#protocol-c'
    $host = $ '#host-c'
    $redirectUrl = $ '#redirect-url-input'
    $testUrl = $ '#test-csurl-input'

    protocol = $protocol.val()
    host = $host.val().trim()
    redirectUrl = $redirectUrl.val().trim()
    testUrl = $testUrl.val().trim()

    # unless host and redirectUrl
    
    matchUrl = protocol + '://' + host

    unless utils.isProtocol protocol
      dialog
        content: utils.i18n 'opt_errtip_protocol'
      .show $protocol[0]
      return

    if false is utils.isRouterStrValid matchUrl
      showInputErrorInfo $host, utils.i18n 'opt_errtip_invalid_matchrule'
      return

    router = utils.getRouter matchUrl, redirectUrl
    if ret = utils.hasReservedWord router
      showInputErrorInfo $host, utils.i18n('opt_errtip_invalid_resvervedkwd') + ': ' + ret.join ','
      return

    if ret = utils.isKwdsUniq router
      showInputErrorInfo $host, utils.i18n('opt_errtip_invalid_duplicatedkwd') + ': ' + ret.join ','
      return
    

    megaRule = isRuleExists router.url, 'custom'
    # custom rules has xcross area???
    if megaRule?
      showInputErrorInfo $host, utils.i18n('opt_errtip_duplicate') + megaRule

    # redirectUrl is empty or not a valid url
    if not utils.isRedirectRuleValid redirectUrl
      showInputErrorInfo $redirectUrl, utils.i18n 'opt_errtip_invalid_redirectrule'
      return
    
    if ret = utils.hasUndefinedWord router, redirectUrl
      showInputErrorInfo $redirectUrl, utils.i18n('opt_errtip_invalid_undefinedkwd') + ': ' + ret.join ','
      return


    unless testUrl
      dialog
        content: utils.i18n 'opt_errtip_urlneedtest'
      .show $testUrl[0]
      return

    unless utils.isUrl testUrl
      dialog
        content: utils.i18n 'opt_errtip_urlinvliad'
        with: 250
      .show $testUrl[0]
      return
    
    megaRule = isRuleExists router.url, 'block'
    if megaRule?
      dialog
        content: utils.i18n('opt_errtip_csconflictedblock') + ': ' + megaRule
        okValue: utils.i18n 'ok_btn'
        ok: ->
      .showModal()
      return
    
    targetUrl = utils.getTargetUrl router, testUrl
    isValid = targetUrl and utils.isUrl targetUrl

    text = targetUrl
    unless isValid
      if targetUrl
        text = '[invalid url] ' + targetUrl
      else
        text = 'not matching'
      
    

    $('#custom-test-result').html "<a target='_blank' href='#{targetUrl or 'javascript:;'}' class='#{if isValid then '' else 'text-danger' }'>#{text}</a>"

    return router if isValid



  # test custom url
  $('#test-csurl-btn').on 'click', (e)->
    do checkCustomRule

  # add an custom rule
  $('#add-csrule').on 'click', ->
    router =  do checkCustomRule
    return unless router
    addRule 'custom', router
    # collection.addRule 'custom', router
    # do resetCustomeForm
    # addRule

  return {
    init: initSection
    isUnionCat: isUnionCat
  }
