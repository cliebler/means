
/***********************************************
 searchHilitr v. 1.0 --- Highlight search keywords
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
      jQ('.searchHilitrContainer,#searchHilitrInfo,#searchHilitrCSS').remove();
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
console.log('going to:'+i);
      var offset = this.pos[i],
      b = jQ('body');
      jQ('html,body').stop().animate({scrollTop: offset-90},800);
      jQ('.searchHilitrWord,.searchHilitrSntce').removeClass('current');
      if(jQ(b).hasClass('searchHilitrContextualize')){
        jQ('.searchHilitrWord.hilite' + i).parent('.searchHilitrSntce').addClass('current');
      }else{
        jQ('.searchHilitrWord.hilite' + i).addClass('current');
      }
      if(isClick){this.currIndex = i;}
    },
    search: function (what,rerun) {
      phrase = what || this.extract(document.referrer) || this.extract(document.location);
      if (!phrase) {
        if(!rerun){
          var a=jQ('<a>nothing happened</a>').click(function(){self.dismiss();});
          var go=jQ("<input type='button' value='Go!'>")
                  .bind('click',function(){
                     self.search(jQ(this).prev().val(),true);
                     jQ('#searchHilitrInfo').hide();
                     jQ('.searchHilitrContainer').show();
                 });
          jQ('#searchHilitrInfo')
            .append("Oops... Couldn't find the word you were looking for..")
            .append("<br/>Pretend ").append(a)
            .append(" or enter your search below:<br/><input class='txt' type='text' size='23'>")
            .append(go);
        }
        jQ('#searchHilitrInfo').show();
        jQ('.searchHilitrContainer').hide();
        jQ('#searchHilitrInfo input:eq(0)').focus();
        return;
      }else{
        jQ('.searchHilitrContainer li:not(.searchHilitrContextLink)').remove();
        jQ('#searchHilitrInfo').hide();
        jQ('.searchHilitrContainer').show();
      }
      var needles=
          phrase.replace(/("|^\s+|\s+$)/g,"")
                .replace(this.config.stopwords,"")
                .replace(/(['-.*+?^${}()|[\]\/\\])/g, "\\$1")
                .replace(/\s+/g, "|");

      //filter-out anything shorter than 3 chars
      if(phrase.length<2) return;
      needles = jQ.makeArray(jQ(needles.split('|')).filter(function () {
                   return this.length > 2
                })).join("|");

      regex = new RegExp('(<[^>]*>)|\\b(' + needles + ')', this.config.isCasesensitive ? 'g' : 'ig');
      tregex = "([^,.?<>]*)\\b(site statistics|statistics|site)";
      tregex = ["([^,.?><]+)\\b(", phrase, ")"].join("");

      this.highlight(jQ('body'), regex, 'searchHilitrWord');
      jQ('html,body').animate({scrollTop:0},0);

      o = [];
      jQ.each(searchHilitr.freq.f, function (k, v) {
        var i=0, sp="", d = [];
        sp = jQ('<span>');
        while (i < v) {
          if (i > 9) break;
          jQ('<a>').text(++i).click((function (n) {
            return function(){self.slideTo(n);}
          })(self.freq['p'][k][i])).appendTo(jQ(sp));
        }
        jQ('<li>')
          .append(jQ('<small>' + k + '<em>(' + v + ')</em></small>')
          .addClass('word' + self.freq['c'][k]))
          .append(sp)
        .appendTo('.searchHilitrContainer')
      });

      //scrollbar nav markers
      var i = 0,o=null,bh = jQ(document).height();
      while (i < this.count) {
        var s=0;
        try{
          o = jQ('.searchHilitrWord').eq(i++).position().top;
        }catch(aarrrgh){}

        this.pos[i] = o||1;
        ratio = o/bh;
        top = ratio * screen.height-70;
        if (top < 80) top = 80+i*2;
        jQ('<a class="scrollbarMark word'+ this.freq['w'][i]+'" title="Go to #' + i + '"></a>')
          .css('top', top)
          .click((function(n){
            return function(){self.slideTo(n);}
          })(i))
        .appendTo("body");
      }
      this.attachShortcuts();
      jQ(".searchHilitrContainer li.searchHilitrContextLink label")
          .eq(3).hide().end()
          .find('input').bind('change', function(){
            self.changeIsGonnaCome(jQ(this).attr('name'),jQ(this).attr('checked'));
          });
    },
    changeIsGonnaCome:function(change, hasCome){
      this.config[change]=hasCome;
      if(change=="enableHilite"){
        var c=".searchHilitrContainer";
        if(hasCome){
          jQ(c).css('height','auto');
        }
        else{
          jQ(c).animate(
               {height: "22px"}, 1000,
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
            .searchHilitrContainer{\
                position:fixed;\
                background-color:#333;\
                width:100%;\
                top:0;margin:0;\
                padding:0 0 5px;\
                display:none;overflow:hidden;\
                line-height:1;\
                border-bottom:10px solid #DAD0C7;\
            }\
            body.showHilitrMenu .searchHilitrContainer{\
                display:block;\
            }\
            body.enableHilite .searchHilitrContainer{\
            }\
            .searchHilitrContainer li{\
                float:left;\
                padding:6px 3px;\
                margin:2px;\
                background:#444 !important;\
                xline-height:1.4em;\
                overflow:hidden;display:none;\
                text-transform:capitalize;\
             }\
           body.enableHilite .searchHilitrContainer li{\
                color:#99f;display:block;\
             }\
           body.searchHilitrColorify .searchHilitrContainer li{\
                color:#666;\
             }\
            .searchHilitrContainer li span{\
                display:block;\
                line-height:12px;\
             }\
            .searchHilitrContainer li.searchHilitrContextLink span{\
                display:inline;color:#888888 !important;border:0 none !important;\
                background:transparent !important;padding:0 !important;\
             }\
            .searchHilitrContainer li label{\
                display:block;color:#999;\
                text-align:left;\
                text-transform:none;\
                white-space:nowrap;\
                float:none;width:auto;\
                margin:0;padding:0;height:17px;\
             }\
            .searchHilitrContainer li span a{\
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
            .searchHilitrContainer li span a:hover{\
                text-shadow:none;\
                color:#fff;\
             }\
            .searchHilitrContainer li small{\
                padding:3px 6px;\
                display:block;\
                margin-bottom:5px;\
                background-color:x#ffff99;font-size:24px;\
             }\
            .searchHilitrContainer li small em{\
                margin-left:8px;background:transparent;\
                font-weight:normal;padding:0;\
                vertical-align:top;font-size:11px;\
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
            #searchHilitrInfo a{\
                color:#CC0000;cursor:pointer;\
            }\
            #searchHilitrInfo a,#searchHilitrInfo a:hover{\
                font-size:100%;\
            }\
            #searchHilitrInfo input{\
                padding:7px;\
                height:auto;\
            }\
            #searchHilitrInfo input.txt{\
                padding:8px;margin:10px 7px 2px 0px;\
            }\
              #searchHilitrInfo,.searchHilitrContainer,.scrollbarMark{\
                z-index:999999;\
              }\
            body.searchHilitrContextualize.enableHilite .searchHilitrSntce,\
            body.enableHilite .searchHilitrWord{\
                background:#ff0 !important;\
                padding:2px 5px 2px 5px !important;\
                -moz-border-radius:2px;color:#000;\
                border:1px solid #aaa !important;\
                display:inline !important;\
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
            body.enableHilite .searchHilitrWord.current{\
                border-color:#555 !important;\
                font-weight:bold;\
                font-size:125%;\
                color:red;\
             }\
            body.enableHilite .searchHilitrWord.current:before{\
                content: '~';\
                position:relative;left:-4px;\
             }\
            .scrollbarMark{\
                position:fixed;\
                right:3px;\
                border-bottom:1px solid #CC0033;\
                padding:3px 6px;\
                background-color:gold;\
                cursor:pointer;\
             }\
            .searchHilitrContainer .searchHilitrContextLink{\
                float:right;display:block;\
                font-size:12px;\
                margin:3px 5px;\
                padding:1px 3px 6px;\
             }\
            .searchHilitrContainer .searchHilitrContextLink input{\
                vertical-align:sub;\
                margin:5px 3px 5px 5px;\
                padding:0;\
             }\
            .searchHilitrContainer .searchHilitrContextLink input{\
                display:inline !important;background:transparent !important;\
             }\
           ";
      jQ('<style id="searchHilitrCSS" type="text/css"></style>').text(css).appendTo("head");
      jQ('<ul class="searchHilitrContainer"></ul><div id="searchHilitrInfo"></div>').prependTo("body");
      jQ('<li>')
        .append(
          '<label><input type="checkbox" name="enableHilite" checked>Highlight ON|OFF</label>'+
          '<label title="Use the LEFT,RIGHT arrow keys to move back and forth">'+
          '<input type="checkbox" name="enableshortcuts" checked>Use arrow keys</label>'+
          '<label><input type="checkbox" name="searchHilitrColorify">Colors, please!</label>'+
          '<label ><input type="checkbox" name="searchHilitrContextualize" disabled>Show in context</label>'
        )
      .addClass('searchHilitrContextLink')
      .appendTo(".searchHilitrContainer");
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
