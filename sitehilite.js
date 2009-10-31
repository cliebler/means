
/***********************************************
 searchHilitr v. 0.1 --- Highlight search keywords
 -- Optimised for bookmarklet use..
 http://www.smallmeans.com/tools/searchHilitr

 Copyright (c) 2009 smallmeans.com
 Revision date: 29 Oct 2009
***********************************************/

javascript: (function () {
  searchHilitr = {
    config:{
      isCasesensitive:false,
      showTopMenu: true,
      enableshortcuts: true,
      //english stop words with length>2
      stopwords: /\b(about|and|are|com|you|for|from|how|that|the|this|was|what|when|where|who|will|with|und|the|www|define:)\b/gi,
    },
    pos: [],
    currIndex: 0,
    count: 0,
    wcount: 0,
    freq: {
      f: {},
      p: {},
      c: {},
      w: {}
    },
    init: function () {
      self = this;
      if (typeof jQuery == 'undefined'||jQuery.prototype.jquery<"1.2.6") {
        this.require(
          'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js',
          function () {
           jQ = jQuery.noConflict();
           self.go();
        });
      } else {
        jQ = jQuery;
        this.go();
      }
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
        this.freq['c'][n] = ++this.wcount;
      }
      this.freq['w'][this.count]=this.freq['c'][n];
      return ['<span class="',
               klass, ' hilite', this.count, ' word', this.freq['c'][n], '"',
               'title="', needle,' #', this.count, '"', '>',needle, '</span>'].join("");
    },
    highlight: function (context, regex, klass) {
      return jQ(context).html(jQ(context).html().replace(regex, function (a, b, c) {
        return (a.charAt(0) == '<') ? a : self.wrap(klass, c);
      }));
    },
    dismiss: function(){
      //tear down Rome and head east..
      jQ('body').removeClass('searchHilitrEnabled enableHilite enableshortcuts showHilitrMenu');
      jQ('._hiliteCont,#searchHilitrInfo,#searchHilitrCSS').remove();
      document.onkeydown=this.oldOnkey;
    },
    extract: function (url) {
      var where = url.toString(),s=null;
      if (where.indexOf('?') == -1) return;
      var q = where.substr(where.indexOf('?') + 1);
      q.replace(/([^=&]+)=([^&]*)/g, function (m, k, v) {
        if (/^(q|p|query|keywords?|search|search_?terms?|sog|soeg|find|s)$/i.test(k)) {
          if (/^cache/.test(v)) {
            v = v.substr(v.indexOf('+') + 1)
          }
          s = unescape(v.replace(/\+/g, ' '));
        }
      });
      return s;
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
    slideTo: function (i, isClick) {
      var offset = this.pos[i], b=jQ('body');
      jQ('html,body').stop().animate({scrollTop: offset-90},800);
      jQ('._hiliteword,._hiliteSntce').removeClass('current');
      if(jQ(b).hasClass('searchHilitrContextualize')){
        jQ('._hiliteword.hilite' + i).parent('._hiliteSntce').addClass('current');
      }else{
        jQ('._hiliteword.hilite' + i).addClass('current');
      }
      if(isClick){this.currIndex = i;}
    },
    search: function (what,rerun) {
      phrase = what || this.extract(document.referrer) || this.extract(document.location);
      if (!phrase) {
        if(!rerun){
          this.notfound();
        }
        jQ('._hiliteCont').hide();
        jQ('#_hiliteInfo').show().find('input:eq(0)').focus();;
        return;
      }else{
        jQ('#_hiliteInfo').hide();
        jQ('._hiliteCont').show()
            .find('li:not(._hiliteOptions)').remove();
      }
      var needles=
          phrase.replace(/("|^\s+|\s+$)/g,"")
                .replace(this.config.stopwords,"")
                .replace(/(['-.*+?^${}()|[\]\/\\])/g, "\\$1")
                .replace(/\s+/g, "|");

      //filter-out anything shorter than 3 chars
      if(needles.length<2|phrase.length<2) return;
      needles = jQ.makeArray(jQ(needles.split('|')).filter(function () {
                   return this.length > 2
                })).join("|");

      regex = new RegExp('(<[^>]*>)|\\b(' + needles + ')', this.config.isCasesensitive ? 'g' : 'ig');
      tregex = "([^,.?<>]*)\\b(site statistics|statistics|site)";
      tregex = ["([^,.?><]+)\\b(", phrase, ")"].join("");
      //console.log(regex,'--',needles,'--',phrase)

      this.highlight(jQ('body'), regex, '_hiliteword');
      jQ('html,body').animate({scrollTop:0},0);

      o = [];
      jQ.each(searchHilitr.freq.f, function (k, v) {
        var i=0, sp="", d = [];
        sp = jQ('<span>');
        while (i < v) {
          if (i > 9) break;
          jQ('<a>').text(++i).click((function (n) {
            return function(){self.slideTo(n, true);}
          })(self.freq['p'][k][i])).appendTo(jQ(sp));
        }
        jQ('<li>')
          .append(jQ('<small>' + k + '<em>(' + v + ')</em></small>')
          .addClass('word' + self.freq['c'][k]))
          .append(sp)
        .appendTo('._hiliteCont')
      });

      //scrollbar nav markers
      var i = 0,o=null,bh = jQ(document).height();
      while (i < this.count) {
        var s=0;
        try{
          o = jQ('._hiliteword').eq(i++).position().top;
        }catch(aarrrgh){}

        this.pos[i] = o||1;
        ratio = o/bh;
        top = ratio * screen.height-70;
        if (top < 80) top = 80+i*2;
        jQ('<a class="scrollbarMark word'+ this.freq['w'][i]+'" title="Go to #' + i + '"></a>')
          .css('top', top)
          .click((function(n){
            return function(){self.slideTo(n, true);}
          })(i))
        .appendTo("body");
      }
      this.attachShortcuts();
      jQ("._hiliteCont li._hiliteOptions label")
          .eq(3).hide().end()
          .find('input').bind('change', function(){
            self.changeIsGonnaCome(jQ(this).attr('name'),jQ(this).attr('checked'));
          });
    },
    changeIsGonnaCome:function(change, hasCome){
      this.config[change]=hasCome;
      if(change=="enableHilite"){
        var c="._hiliteCont";
        if(hasCome){
          jQ(c).css('height','auto');
        }
        else{
          jQ(c).animate(
               {height: "20px"}, 1000,
                function(){
                 jQ('body').toggleClass(change);
               });return;
        }
      }
      jQ('body').toggleClass(change);
    },
    require: function (src, callback) {
      var c = document.createElement("script");
      c.src = src;
      c.type = "text/javascript";
      if (callback) {
        c.onload = callback;
      }
      document.getElementsByTagName("head")[0].appendChild(c);
    },
    attachShortcuts: function () {
      this.oldOnkey = document.onkeydown;
      document.onkeydown = function (e) {
        var a = e || window.event;
        if(typeof self.oldOnkey == 'function') {
          self.oldOnkey(e);
        }
        if(!self.config.enableshortcuts){
          return;
        }
        if(a.keyCode == 37) {//left arrow
          self.prevInstance();
        }
        else if(a.keyCode == 39) {//right arrow
          self.nextInstance();
        }
      }
    },
    notfound: function(){
      var a=jQ('<a>nothing happened</a>')
            .click(function(){self.dismiss();});
      var b=jQ("<input type='button' value='Go!'>")
              .bind('click',function(){
                 self.search(jQ(this).prev().val(),true);
                 jQ('#_hiliteInfo').hide();
                 jQ('._hiliteCont').show();
             });
      jQ('#_hiliteInfo')
        .append("Oops... Couldn't find the word you were looking for..")
        .append("<br/>Pretend ").append(a)
        .append(" or enter your search below:<br/><input class='txt' type='text' size='23'>")
        .append(b);
    },
    go: function (phrase){
      if(jQ('body').hasClass('searchHilitrEnabled')){
        return this.search(phrase,true);
      }
      var css = "\
            body{margin-top:78px;position:relative;}\
            body.searchHilitrColorify.enableHilite .word1{background-color: #FFFF66 !important}\
            body.searchHilitrColorify.enableHilite .word3{background-color: #88cc00 !important}\
            body.searchHilitrColorify.enableHilite .word2{background-color: #FF99FF !important}\
            body.searchHilitrColorify.enableHilite .word4{background-color: #A0FFFF !important}\
            body.searchHilitrColorify.enableHilite .word5{background-color: #ff6666 !important}\
            body.searchHilitrColorify.enableHilite .word6{background-color: #3333ff !important}\
            ._hiliteCont{\
                position:fixed;\
                background-color:#333;\
                width:100%;\
                top:0;margin:0;\
                padding:0 0 5px;\
                overflow:hidden;\
                line-height:1;\
                border-bottom:10px solid #DAD0C7;\
            }\
            body.showHilitrMenu ._hiliteCont{\
                display:block;\
            }\
            body.enableHilite ._hiliteCont{\
            }\
            ._hiliteCont li{\
                float:left;\
                padding:6px 3px;\
                margin:2px;\
                background:#444 !important;\
                xline-height:1.4em;\
                overflow:hidden;\
                text-transform:capitalize;\
             }\
           body.enableHilite ._hiliteCont li,\
           body.enableHilite .scrollbarMark{\
                color:#99f;display:block;\
             }\
           body.searchHilitrColorify ._hiliteCont li{\
                color:#666;\
             }\
            ._hiliteCont li span{\
                display:block;\
                line-height:12px;\
             }\
            ._hiliteCont li._hiliteOptions span{\
                display:inline;color:#888888 !important;border:0 none !important;\
                background:transparent !important;padding:0 !important;\
             }\
            ._hiliteCont li label{\
                display:block;color:#999;\
                text-align:left;\
                text-transform:none;\
                white-space:nowrap;\
                float:none;width:auto;\
                margin:0;padding:0;height:17px;\
             }\
            ._hiliteCont li span a{\
                padding:1px 3px;\
                margin:0 2px;\
                background-color:#ddd;\
                background-color:#555;\
                font-size:12px;\
                cursor:pointer;\
                color:#999;\
                text-decoration:none;\
                text-shadow:1px 1px 1px #000;\
             }\
            ._hiliteCont li span a:hover{\
                text-shadow:none;\
                color:#fff;\
             }\
            ._hiliteCont li small{\
                padding:3px 6px;\
                display:block;\
                margin-bottom:5px;\
                background-color:x#ffff99;font-size:24px;\
             }\
            ._hiliteCont li small em{\
                margin-left:8px;background:transparent;\
                font-weight:normal;padding:0;\
                vertical-align:top;font-size:11px;\
             }\
            #_hiliteInfo{\
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
            #_hiliteInfo a{\
                color:#CC0000;cursor:pointer;\
            }\
            #_hiliteInfo a,#_hiliteInfo a:hover{\
                font-size:100%;\
            }\
            #_hiliteInfo input{\
                padding:7px;\
                height:auto;\
                width:auto;\
                display:inline;\
            }\
            #_hiliteInfo input.txt{\
                padding:8px;margin:10px 7px 2px 0px;\
            }\
              #_hiliteInfo,._hiliteCont,.scrollbarMark{\
                z-index:999999;\
              }\
            body.searchHilitrContextualize.enableHilite ._hiliteSntce,\
            body.enableHilite ._hiliteword{\
                background:#ff0 !important;\
                padding:2px 5px 2px 5px !important;\
                -moz-border-radius:2px;color:#000;\
                border:1px solid #aaa !important;\
                display:inline !important;\
             }\
            body.searchHilitrContextualize ._hiliteSntce.current{\
                border:1px solid red;\
             }\
            body.searchHilitrContextualize ._hiliteSntce.current ._hiliteword{\
                border:none;\
             }\
            body.searchHilitrContextualize ._hiliteSntce{\
                xbackground-color:gold;\
             }\
            body.searchHilitrContextualize ._hiliteword{\
                background-color:red;\
                padding:2px;\
             }\
            body.enableHilite ._hiliteword.current{\
                border-color:#555 !important;\
                font-weight:bold;\
                font-size:125%;\
                color:red;\
             }\
            body.enableHilite ._hiliteword.current:before{\
                _content: '|';\
             }\
            .scrollbarMark{\
                position:fixed;\
                right:3px;\
                border-bottom:1px solid #CC0033;\
                padding:3px 6px;\
                background-color:gold;\
                cursor:pointer;\
             }\
            ._hiliteCont ._hiliteOptions{\
                float:right;display:block;\
                font-size:12px;\
                margin:3px 5px;\
                padding:1px 3px 6px;\
             }\
            ._hiliteCont ._hiliteOptions input{\
                vertical-align:sub;\
                margin:5px 3px 5px 5px;\
                padding:0;\
             }\
            ._hiliteCont ._hiliteOptions input{\
                display:inline !important;background:transparent !important;\
             }\
            .scrollbarMark,._hiliteCont,._hiliteCont li,#_hiliteInfo{\
                display:none;\
             }\
           ";
      jQ('<style id="searchHilitrCSS" type="text/css"></style>').text(css).appendTo("head");
      jQ('<ul class="_hiliteCont"></ul><div id="_hiliteInfo"></div>').prependTo("body");
      jQ('<li>')
        .append(
          '<label><input type="checkbox" name="enableHilite" checked>Highlight ON|OFF</label>'+
          '<label title="Use the LEFT,RIGHT arrow keys to move back and forth">'+
          '<input type="checkbox" name="enableshortcuts" checked>Use arrow keys</label>'+
          '<label><input type="checkbox" name="searchHilitrColorify">Colors, please!</label>'+
          '<label ><input type="checkbox" name="searchHilitrContextualize" disabled>Show in context</label>'
        )
      .addClass('_hiliteOptions')
      .appendTo("._hiliteCont");
      jQuery('script').remove();
      jQ('body').addClass('searchHilitrEnabled enableHilite enableshortcuts');
      if (this.config.showTopMenu) {
        jQ('body').addClass('showHilitrMenu');
      }
      this.search(phrase);
    }
  }
})();
searchHilitr.init();
