
/***********************************************
 searchHilitr v. 1.0 --- Highlight search keywords
 http://www.smallmeans.com/tools/searchHilitr

 Copyright (c) 2009 smallmeans.com 
 Revision date: 27 Oct 2009
***********************************************/

javascript: (function () {
  searchHilitr = {
    config:{
      isCasesensitive:false,
      showTopMenu: true,
      useArrowKeys: true,
      //english stop words with length>2
      stopwords: /\\b(about|are|com|for|from|how|that|the|this|was|what|when|where|who|will|with|und|the|www)\\b/,
    },
    pos: [],
    currIndex: 0,
    count: 0,
    ccount: 0,    
    freq: {
      f: {},
      p: {},
      c: {}
    },
    go: function (phrase) {
      var css = "\
            body{margin-top:78px;position:relative;}\
            body.searchHilitrColorify.searchHilite-ON .word1{background-color: #FFFF66 !important}\
            body.searchHilitrColorify.searchHilite-ON .word3{background-color: #88cc00 !important}\
            body.searchHilitrColorify.searchHilite-ON .word2{background-color: #A0FFFF !important}\
            body.searchHilitrColorify.searchHilite-ON .word4{background-color: #CC33FF !important}\
            body.searchHilitrColorify.searchHilite-ON .word5{background-color: #ff6666 !important}\
            body.searchHilitrColorify.searchHilite-ON .word6{background-color: #3333ff !important}\
            .searchHilitrContainer{\
                position:fixed;\
                background-color:#333;\
                width:100%;\
                top:0;margin:0;\
                padding:0;\
                display:none;\
            }\
            body.showHilitrMenu .searchHilitrContainer{\
                display:block;\
            }\
            .searchHilitrContainer li{\
                color:#666;\
                font-size:27px;\
                float:left;\
                padding:6px 3px;\
                margin:2px 2px 10px;\
                background-color:#eee !important;\
                xline-height:1.4em;\
                overflow:hidden;\
                text-transform:capitalize;\
             }\
            .searchHilitrContainer li span{\
                display:block;\
                line-height:12px;\
             }\
            .searchHilitrContainer li label{\
                display:block;\
                text-align:left;\
                text-transform:none;\
             }\
            .searchHilitrContainer li span a{\
                padding:1px 3px;\
                margin:0 2px;\
                background-color:#888;\
                background-color:#ddd;\
                font-size:12px;\
                cursor:pointer;\
                color:blue;\
             }\
            .searchHilitrContainer li small{\
                padding:6px;\
                display:block;\
                margin-bottom:5px;\
                background-color:#ffff99;\
             }\
            .searchHilitrContainer li small em{\
                margin-left:8px\
             }\
            #searchHilitrInfo{\
                display:none;\
                color:#FFF5DC;\
                width:100%;\
                line-height:28px;\
                padding:30px 30px 30px 20%;\
                 background:#000;\
                text-align:left;\
                top: 35%;\
                 position: fixed;\
                 font-size:20px;\
              }\
              #searchHilitrInfo,.searchHilitrContainer,.scrollbarMark{\
                z-index:999999;\
              }\
            body.searchHilitrContextualize.searchHilite-ON .searchHilitrSntce,\
            body.searchHilite-ON .searchHilitrWord{\
                background-color:#ff0 !important;\
                padding:2px 5px 2px 5px !important;\
                -moz-border-radius:2px;\
                border:1px solid #aaa !important;\
             }\
            body.searchHilitrContextualize .searchHilitrSntce.current{\
                border:1px solid red;\
             }\
            body.searchHilitrContextualize .searchHilitrSntce.current .searchHilitrWord{\
                border:none;\
             }\
            body.searchHilitrContextualize .searchHilitrSntce{\
                xbackground-color:gold;\
             }\
            body.searchHilitrContextualize .searchHilitrWord{\
                background-color:red;\
                padding:2px;\
             }\
            body.searchHilite-ON .searchHilitrWord.current{\
                border-color:#555 !importantimportant;\
                font-weight:bold;\
                font-size:125%;\
                color:red;\
             }\
            .scrollbarMark{\
                position:fixed;\
                right:3px;\
                border-bottom:1px solid red;\
                padding:3px 6px;\
                background-color:gold;\
                cursor:pointer;\
             }\
            .searchHilitrContainer .searchHilitrContextLink{\
                float:right;\
                font-size:12px;\
                margin:3px 5px;\
                padding:3px;\
             }\
            .searchHilitrContainer .searchHilitrContextLink input{\
                vertical-align:sub;\
                margin:5px 3px 5px 5px;\
                padding:0;\
             }\
           ";
      jQ('<style id="searchHilitrCSS" type="text/css"></style>').text(css).appendTo("head");
      jQ('<ul class="searchHilitrContainer"></ul><div id="searchHilitrInfo"></div>').prependTo("body");
      jQ('<li>')
        .append('<label><input type="checkbox" name="searchHilite-ON" checked>Highligh ON/OFF</label>')
        .append('<label><input type="checkbox" name="searchHilitrColorify">Colorify</label>')
        .append('<label><input type="checkbox" name="enableshortcuts" checked>Use arrow keys</label>')
        .append('<label ><input type="checkbox" name="searchHilitrContextualize" disabled>Show in context</label>')
      .addClass('searchHilitrContextLink')
      .appendTo(".searchHilitrContainer");
      jQ(".searchHilitrContainer li.searchHilitrContextLink label").eq(3).hide().end().find('input').live('change', function () {
        jQ('body').toggleClass(jQ(this).attr('name'));
      });
      jQ('body').addClass('XsearchHilitrColorify searchHilite-ON enableshortcuts');
      if (this.config.showTopMenu) {
        jQ('body').addClass('showHilitrMenu');
      }
      jQuery('script').remove();
      this.search(phrase);
    },
    init: function () {
      self = this;
      if (typeof jQuery == 'undefined') {
        this.require('http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js', function () {
          jQ = jQuery.noConflict();
          self.go()
        })
      } else {
        jQ = jQuery;
        this.go()
      }
    },
    require: function (src, callback) {
      var c = document.createElement("script");
      c.src = src;
      c.type = "text/javascript";
      if (callback) {
        c.onload = callback
      }
      document.getElementsByTagName("head")[0].appendChild(c)
    },
    attachShortcuts: function () {
      this.oldOnkey = document.onkeydown;
      document.onkeydown = function (e) {
        var a = e || window.event;
        if (typeof self.oldOnkey == 'function') {
          self.oldOnkey(e);
        }
        if (!
        /*this.useArrowKeys*/
        jQ('body').hasClass('enableshortcuts')) {
          return;
        }
        if (a.keyCode == 37) {//left arrow
          self.prevInstance();
        }
        else if (a.keyCode == 39) {//right arrow
          self.nextInstance();
        }
      }
    },
    nextInstance: function () {
      if (this.currIndex == this.count) {
        return;
      }
      this.slideTo(++this.currIndex);
    },
    prevInstance: function () {
      if (this.currIndex == 1) {
        return;
      }
      this.slideTo(--this.currIndex);
    },
    extract: function (url) {
      var where = url.toString();
      if (where.indexOf('?') == -1) return;
      var q = where.substr(where.indexOf('?') + 1);
      q.replace(/([^=&]+)=([^&]*)/g, function (m, k, v) {
        if (/^(q|p|query|keywords?|search|search_?terms?|s)$/i.test(k)) {
          if (/^cache/.test(v)) {
            v = v.substr(v.indexOf('+') + 1)
          }
          s = unescape(v.replace(/\+/g, ' '));
        }
      });
      return s;
    },
    gotoLink: function (el) {
      this.slideTo(jQ(el).data('c'), true);
    },
    slideTo: function (i, byClick) {
      var offset = this.pos[i],
      b = jQ('body');
      jQ('html,body').stop().animate({
        scrollTop: offset - 90
      },
      800);
      jQ('.searchHilitrWord,.searchHilitrSntce').removeClass('current');
      if(jQ(b).hasClass('searchHilitrContextualize')){
        jQ('.searchHilitrWord.hilite' + i).parent('.searchHilitrSntce').addClass('current');
      }else{
        jQ('.searchHilitrWord.hilite' + i).addClass('current');
      }
      if(byClick){this.currIndex = i;}
    },
    wrap: function (klass, needle) {
      n = needle.toLowerCase();
      this.count++;
      //this.freq['f'][n]=this.freq['f'][n]?++this.freq['f'][n]:1;
      if (this.freq['f'][n]) {
        this.freq['f'][n]++;
        this.freq['p'][n][this.freq['f'][n]] = this.count;
      } else {
        this.freq['f'][n] = 1;
        this.freq['p'][n] = {};
        this.freq['p'][n][1] = this.count;
        this.freq['c'][n] = ++this.ccount;
      }
      return ['<span class="', klass, ' hilite', this.count, ' word', this.freq['c'][n], '">', needle, '</span>'].join("");
    },
    highlight: function (context, regex, klass) {
      return jQ(context).html(jQ(context).html().replace(regex, function (a, b, c) {
        return (a.charAt(0) == '<') ? a : self.wrap(klass, c);
      }));
    },
    search: function (what) {
      phrase = what || this.extract(document.referrer) || this.extract(document.location);
      if (!phrase) {
        jQ('#searchHilitrInfo').append("Oops... Couldn't find the word you were looking for..").append("<br/>Pretend <a href='#'>nothing happened</a> or enter your search below:").click(function () {
          jQ('.searchHilitrContainer,#searchHilitrInfo,#searchHilitrCSS').remove()
        }).show();
        return;
      }
      var needles=phrase.replace(/([-.*+?^${}()|[\]\/\\])/g, "\\$1")
                      .replace(/^\s+|\s+$/g, "")
                      .replace(/\s+/g, "|");
      
      //filter-out anything shorter than 4 chars
      needles = jQ.makeArray(jQ(needles.split('|')).filter(function () {
        return this.length > 2
      })).join("|");
      regex = ["([^,.?><]+)\\b(", phrase, ")"].join("");
      regex = new RegExp('(<[^>]*>)|\\b(' + needles + ')', this.config.isCasesensitive ? 'g' : 'ig');
      xregex = "([^,.?<>]*)\\b((search phrase)|(search|phrase))";
      console.log(regex);
      xregex = "([^,.]+)(site statistics|statistics|site)";
      this.highlight(jQ('body'), regex, 'searchHilitrWord');
      o = [];
      jQ.each(searchHilitr.freq.f, function (k, v) {
        var i = 0,
        d = [];
        sp = jQ('<span>');
        while (i < v) {
          if (i > 9) break;
          jQ('<a>').text(++i).data('c', self.freq['p'][k][i]).bind('click', function () {
            self.gotoLink(this);
          }).appendTo(jQ(sp));
        }
        jQ('<li>')
          .append(jQ('<small>' + k + '<em>(' + v + ')</em></small>')
          .addClass('word' + self.freq['c'][k]))
          .append(sp)
        .appendTo('.searchHilitrContainer')
      });
      
      //scrollbar anchors
      var i = 0,
      bh = jQ(document).height();
      while (i < this.count) {
        var o = jQ('.searchHilitrWord').eq(i++).offset().top,
        s = 0;
        this.pos[i] = o;
        ratio = o/bh;
        top = ratio * screen.availHeight-100;
        if (top < 80) top = 80+i*2;
        jQ('<a class="scrollbarMark" title="Go to #' + i + '"></a>')
          .data('c', i).css('top', top)
          .bind('click', function () {
            self.gotoLink(this);
          })
        .appendTo("body");
      }
      this.attachShortcuts();
    }
  }
})();
searchHilitr.init();

