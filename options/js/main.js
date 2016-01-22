// Generated by CoffeeScript 1.10.0
var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

define(function(require) {
  var dialog, isPageCat, pageCtrls, pageIds;
  pageCtrls = {
    union: require('js/union-page'),
    qrcode: require('js/qr-page'),
    utility: require('js/utility-page'),
    'ext-settings': require('js/ext-settings-page')
  };
  pageIds = $('#nav>li>a').map(function() {
    var href;
    href = this.getAttribute('href');
    if (href[0] === '#') {
      return href.replace('#', '');
    }
  }).get();
  require('lib/artdialog/css/ui-dialog.css');
  dialog = require('dialog');

  /**
   * check a setting section cat
   * @param  {String}  cat cat name
   * @return {Boolean}
   */
  isPageCat = function(cat) {
    var ref;
    return ref = (cat || '').replace('#', ''), indexOf.call(pageIds, ref) >= 0;
  };
  $(document).on('click', 'a[href^=#]', function(e) {
    var $navLink, $unionCat, cat, ref;
    cat = $(this).attr('href').replace('#', '');
    if (!isPageCat(cat)) {
      return;
    }
    $navLink = $("#nav a[href^=#" + cat + "]").parent();
    if ($navLink.hasClass('active')) {
      return;
    }
    location.hash = cat;
    $navLink.siblings().removeClass('active');
    $navLink.addClass('active');
    $unionCat = $('#request-settings');
    $unionCat.removeClass('active');
    if (pageCtrls.union.isUnionCat(cat)) {
      pageCtrls.union.init(cat);
      setTimeout(function() {
        $unionCat.addClass('active');
      }, 100);
    } else {
      if ((ref = pageCtrls[cat]) != null) {
        ref.init(cat);
      }
    }
  });
  (function() {
    var cat;
    cat = location.hash.replace('#', '');
    if (!isPageCat(cat)) {
      cat = 'custom';
    }
    $("#nav a[href^=#" + cat + "]").click();
  })();
});


//# sourceMappingURL=main.js.map