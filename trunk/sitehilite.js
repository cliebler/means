/***********************************************
 sitehilite v. 0.1 --- Highlight search keywords
 -- Optimised for bookmarklet use..
 http://www.smallmeans.com/tools/sitehilite

 Copyright (c) 2009 smallmeans.com
 First revision: 29 Oct 2009
***********************************************/

javascript: (function(){
  sitehilite = {
    config:{
      isCasesensitive:false,
      enableArrowKeys: true,
      enableInput:false,
      beginsWith:true,
      endsWith:false,
      content:'body',
      colorify:true,
      minLength:3,
      navMenu:{
        show: true,
        position:'top'
      },
      terms:/^(q|p|query|keywords?|search|search_?terms?|sog|soeg|find|s)$/i,      
      //english stop words with length>2
      stopwords: "about|and|are|com|xyou|for|from|how|that|then|the"+
                 "this|was|what|when|where|who|will|with|und|the|www|define:",
    },
    pos :[],    
    stats:{
       f: {},
       p: {},
       c: {},
       w: []
    },
    wrap: function (klass, tag, needle) {
      //counting frequencies, succession of words
     // and indexing first and subsequent occurences
      var w = needle.data.toLowerCase();
      n=++this.count;
      if(this.stats['f'][w]) {
        this.stats['f'][w]++;
        this.stats['p'][w][this.stats['f'][w]] = n;
      }else{
        this.stats['p'][w] = [];
        this.stats['p'][w][1] = n;
        this.stats['c'][w] = ++this.wcount;
        this.stats['f'][w] = 1;
      }
      this.stats['w'][n]=this.stats['c'][w];
      return jQ(['<'+tag+' class="',
               klass, ' hilite', n, ' word', this.stats['c'][w], '"',
               'xtitle="', w,' is match #',n,'"', '/>']
             .join("")).append(needle);
    },
    wrapWordsInDescendants:function(element, needleRegex, tagName, className) {
      for(var i= element.childNodes.length; i-->0;){
        var child=element.childNodes[i];
        if(child.nodeType==1){ // Node.ELEMENT_NODE
          this.wrapWordsInDescendants(child, needleRegex, tagName, className);
        }    
        else if(child.nodeType==3){ // Node.TEXT_NODE
          this.wrapWordsInText(child, needleRegex, tagName, className);
        }
      }
    },
    //hat tip to BobInce @ u.nu/7d2r3    
    wrapWordsInText:function(node, needleRegex, tagName, className) {
      var indices=[], match;
      while (match= needleRegex.exec(node.data)){
        indices.push([match.index, match.index+match[0].length]);
      }
      for(var i=indices.length; i-->0;){
        node.splitText(indices[i][1]);
        var txt=node.splitText(indices[i][0]);
        var e=this.wrap(className, tagName, txt);
        jQ(node).after(e);
      }
    },
    highlight: function (context, needleRegex, tag, klass){
      return context.each(function() {
        self.wrapWordsInDescendants(this, needleRegex, tag, klass);
      });
    },
    highlight_old_and_busted: function (context, regex, klass) {
      return jQ(context).html(jQ(context).html().replace(regex, function (a, b, c) {
        return (a.charAt(0) == '<') ? a : self.wrap(klass, c);
      }));
    },
    dismiss: function(){
      //tear down and head east..
      document.onkeydown=this.oldOnkey;      
      jQ('._hiliteCont,#sitehiliteInfo,#sitehiliteCSS').remove();
      jQ('body').removeClass('sitehiliteEnabled enableHilite '+
                'enableArrowKeys showHilitrMenu hilitetop colorify');
      
    },
    extract: function (url) {
      var where = url.toString(),s=null;
      if (where.indexOf('?') == -1) return;
      var q = where.substr(where.indexOf('?') + 1);
      q.replace(/([^=&]+)=([^&]*)/g, function (m, k, v) {
        if (self.config.terms.test(k)) {
          if (/^cache/.test(v)) {
            v = v.substr(v.indexOf('+') + 1)
          }
          s = unescape(v).replace(/[,\+]+/g, ' ');
        }
      });
      return s;
    },
    prevmatch: function(){
      this.currIndex < this.count && 
       this.slideTo(++this.currIndex);
    },
    nextmatch: function(){
      this.currIndex>1 &&
       this.slideTo(--this.currIndex);
    },
    slideTo: function (i, isClick) {
      var offset=this.pos[i]-jQ('._hiliteCont').height()-20;
      jQ('html,body').stop()
         .animate({scrollTop: offset},800);
      jQ('._hiliteword')
         .removeClass('current')
         .filter('.hilite'+i).addClass('current');
      if(isClick){this.currIndex = i;}         
    },
    log: function (beep) {
      window.console && console.log(beep);
    },    
    getNeedles: function(phrase){
      var needles=
             phrase
            .replace(/("|^\s+|\s+$)/g,"") //unquote,trim
            .replace(this.config.stopwords,"")
            .replace(/(['-.*+?^${}()|[\]\/\\])/g, "\\$1")//escape some
            .replace(/[\s,]+/g, "|");//expand
            
      //filter-out digits and anything shorter than minLength chars
      return jQ.makeArray(jQ(needles.split('|')).filter(function(){
               return this.length >= self.config.minLength &&
                 !/^\d+$/.test(this);
            }));
    
    },    
    search: function (needles) {    
      var sense=this.config.isCasesensitive ? 'g' : 'ig';
      var pre =this.config.beginsWith?'\\b':'';
      var post=this.config.endsWith?'\\b':'';
      var regex = new RegExp([pre, '(' + needles.join("|") + ')',post].join(""), sense);
      //regex=/\b((lorem( ?ipsum( ?dolor( ?sap( ?safari)?)?)?)?)|(ipsum|dolor|sap|safari))/gi
      //var regex = new RegExp(['(<[^>]*>)|',pre..
      this.log(regex.toString(),'--',needles)
      //console.time('DOMWalkingTimer');
      this.highlight(jQ(this.config.content), regex, 'span', '_hiliteword');         
      //console.timeEnd('DOMWalkingTimer');
      jQ('html,body').animate({scrollTop:0},0);

      if(this.count<1){
        if(this.config.enableInput){
          this.showDialog(true);
        }  
        return;
      } 
      var o = [];
      jQ.each(this.stats.f, function (k, v) {
        self.stats['p'][k].reverse();
        var i=0, sp="", d = [];
        sp = jQ('<span>');
        while (i++ < v) {
          if (i > 10) break;
          jQ('<a>').text(i).click((function (n) {
            return function(){self.slideTo(n, true);}
          })(self.stats['p'][k][i-1])).appendTo(jQ(sp));
        }
        jQ('<li>')
          .append(jQ('<small>' + k + '<em>(' + v + ')</em></small>')
          .addClass('word' + self.stats['c'][k]))
          .append(sp)
        .appendTo('._hiliteCont')
      });

      //scrollbar nav markers
      var ratio=o=0,bh = jQ(document).height(),i=this.count+1;
      while (i-->1) {
        var s=0;
        try{
          o = jQ('.hilite'+i).position().top;
        }catch(aarrrgh){o=0}

        this.pos[i] = o||1;
        ratio = o/bh;
        top = ratio * screen.availHeight;//document.body.clientHeight;
        if (top < 80) top = 80+Math.random()*10;
        jQ('<a>')
          .css('top', top)
          .attr('title', 'Go to corresponding match #'+(this.count-i+1))
          .click((function(n){
            return function(){self.slideTo(n, true);}
          })(i))
          .addClass('scrollbarMark word'+this.stats['w'][i])
        .appendTo("body");
      }
      this.attachKeys();
      if(this.config.callback){
        this.config.callback.call();
      }
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
    attachKeys: function(){
      if(!this.oldOnkey){
        this.oldOnkey = document.onkeydown;
      }  
      document.onkeydown = function (e) {
        var a = e || window.event;
        if(typeof self.oldOnkey == 'function') {
          self.oldOnkey(e);
        }
        if(!self.config.enableArrowKeys){
          return;
        }
        if(a.keyCode == 37) {//left arrow
          self.prevmatch();
        }
        else if(a.keyCode == 39) {//right arrow
          self.nextmatch();
        }
      }
    },
    ready: function (phrase){
      this.isbkmklet&&this.go(phrase)||
      jQ(document).ready(function(){
        self.go(phrase);
      });
    },
    init: function (conf,phrase){
      self = this;    
      this.count=this.wcount=this.nodes=this.currIndex=0;      
      this.config.stopwords=new RegExp('\\b('+this.config.stopwords+')\\b','ig');
      for(i in conf){
        this.config[i]=conf[i];
      }
      if(typeof jQuery == 'undefined'||jQuery.prototype.jquery<"1.2.6"){
        this.require(
          'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js',
          function(){
           jQ = jQuery.noConflict();
           self.ready(phrase);
        });
      } else {
        jQ = jQuery;
        this.ready(phrase);
      }
    },
    showDialog: function(reveal){
      var a=jQ('<a>nothing happened</a>')
            .click(function(){self.dismiss();});
      var b=jQ("<input type='button' value='Go!'>")
              .bind('click',function(){
                 self.search(jQ(this).prev().val(),true);
                 jQ('#sitehiliteInfo').hide();
                 jQ('._hiliteCont').show();
             });
      jQ('#sitehiliteInfo')
        .append("Oops... Couldn't find the word you were looking for..")
        .append("<br/>Pretend ").append(a)
        .append(" or enter another search below:<br/>"+
                "<input title='Partial words are OK, separate by space'"+
                " class='txt' type='text' size='23'>")
        .append(b).toggle(reveal);
    },
    isbkmklet:true,
    go: function (what){
      var phrase = what || this.extract(document.referrer) || this.extract(document.location);
      if (!phrase) {
        if(this.config.enableInput){
          if(!rerun){
            this.showDialog();
          }
          jQ('#sitehiliteInfo').show().find('input:eq(0)').focus();
          jQ('._hiliteCont').hide();
        }else{
          //this.dismiss();
        }
        return;
      }else{
        jQ('#sitehiliteInfo').hide();
        jQ('._hiliteword').attr('class','');
        jQ('._hiliteCont').show()
            .find('li:not(._hiliteOptions)').remove();
      }
      var needles=this.getNeedles(phrase);
      if(needles.length<1){
        return;
      } 
      if(jQ('body').hasClass('sitehiliteEnabled')){
        return this.search(needles,true);
      }
      //<><![CDATA[..]]></>.toString();
      var css = "\
            body{position:relative;}\
            body.hilitetop{margin-top:90px;}body.hilitebottom{margin-bottom:84px;}\
            body.colorify.enableHilite .word1{background-color: #FFFF66 !important}\
            body.colorify.enableHilite .word3{background-color: #88cc00 !important}\
            body.colorify.enableHilite .word2{background-color: #FF99FF !important}\
            body.colorify.enableHilite .word4{background-color: #A0FFFF !important}\
            body.colorify.enableHilite .word5{background-color: #ff6666 !important}\
            body.colorify.enableHilite .word6{background-color: #3333ff !important}\
            body.colorify.enableHilite .word7{background-color: #964B00 !important}\
            body.colorify.enableHilite .word8{background-color: #00FF00 !important;}\
            body.colorify.enableHilite .word8,body.colorify.enableHilite .word6{color:#000 !important}\
            ._hiliteCont{\
                position:fixed;\
                background-color:#333;\
                width:100%;\
                margin:0;left:0;\
                padding:0 0 5px;\
                overflow:auto;\
                line-height:1;\
                border-bottom:10px solid #DAD0C7;\
            }\
            body.showHilitrMenu ._hiliteCont{\
                display:block;\
            }\
            body.hilitetop ._hiliteCont{\
                top:0;\
            }\
            body.hilitebottom ._hiliteCont{\
                bottom:0;\
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
            body.colorify ._hiliteCont li{\
                color:#666;\
            }\
            ._hiliteCont li._hiliteOptions{\
                float:right;display:block;\
                font-size:12px;\
                margin:3px 5px;\
                padding:1px 3px 6px;\
            }\
            ._hiliteCont li._hiliteOptions input{\
                vertical-align:sub;\
                margin:5px 3px 5px 5px;\
                padding:0;\
            }\
            ._hiliteCont li._hiliteOptions input{\
                display:inline !important;background:transparent !important;\
            }\
            ._hiliteCont li span{\
                display:block;\
                line-height:12px;\
                text-align:left;\
            }\
            body ul._hiliteCont li._hiliteOptions label span{\
                display:inline;color:#888888 !important;border:0 none !important;\
                background:transparent !important;padding:0 !important;\
            }\
            ._hiliteCont li span a{\
                padding:1px 3px;\
                margin:0 2px;\
                background-color:#ddd;\
                background-color:#555;\
                font-size:10px;\
                cursor:pointer;\
                color:#999;\
                text-decoration:none;\
                text-shadow:1px 1px 1px #000;\
            }\
            ._hiliteCont li span a:hover{\
                text-shadow:none;\
                color:#fff;\
            }\
            ._hiliteCont li label{\
                display:block;color:#999;\
                text-align:left;\
                text-transform:none;\
                white-space:nowrap;\
                float:none;width:auto;\
                margin:0;padding:0;height:17px;\
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
            #sitehiliteInfo{\
                color:#FFF5DC;\
                width:100%;\
                line-height:28px;\
                padding:30px 30px 30px 20%;\
                 background:#000;\
                text-align:left;\
                top: 35%;\
                left:0;\
                overflow: auto;\
                position: fixed;\
                font-size:20px;\
            }\
            #sitehiliteInfo a{\
                color:#CC0000;cursor:pointer;\
            }\
            #sitehiliteInfo a,#sitehiliteInfo a:hover{\
                font-size:100%;\
            }\
            #sitehiliteInfo input{\
                padding:7px;\
                height:auto;\
                width:auto;\
                display:inline;\
            }\
            #sitehiliteInfo input.txt{\
                padding:8px;margin:10px 7px 2px 0px;\
            }\
              #sitehiliteInfo,._hiliteCont,.scrollbarMark{\
                z-index:999999;\
            }\
            body.enableHilite ._hiliteword{\
                background:#ff0 !important;\
                padding:2px 0px 2px 5px !important;\
                -moz-border-radius:2px;color:#000;\
                border:1px solid #aaa !important;\
                display:inline !important;\
            }\
            body.enableHilite ._hiliteword.current{\
                border-color:red !important;\
                font-weight:bold;\
                font-size:125%;\
                xcolor:red;\
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
            .scrollbarMark,._hiliteCont,._hiliteCont li,#sitehiliteInfo{\
                display:none;\
            }\
        ";
      jQ('<style id="sitehiliteCSS" type="text/css"></style>').text(css).appendTo("head");
      jQ('<ul class="_hiliteCont"></ul><div id="sitehiliteInfo"></div>').prependTo("body");
      jQ('<li>')
        .append(
          '<label><input type="checkbox" name="enableHilite" checked>Highlight ON|OFF</label>'+
          '<label title="Use the LEFT,RIGHT arrow keys to move back and forth">'+
          '<input type="checkbox" name="enableArrowKeys" checked>Use arrow keys</label>'+
          '<label><input type="checkbox" name="colorify">Colors, please!</label>'+
          '<label ><input type="checkbox" name="sitehiliteContextualize" disabled>Show in context</label>'
        )
      .addClass('_hiliteOptions')
      .appendTo("._hiliteCont");
      jQ('script').remove();
      jQ('._hiliteCont label input[name=colorify]').attr('checked', this.config.colorify);
      var klass='sitehiliteEnabled enableHilite '+
                    (this.config.navMenu.position=='top'?'hilitetop':'hilitebottom')+
                    (this.config.navMenu.show?' showHilitrMenu':'')+
                    (this.config.colorify?' colorify':'');
      jQ('body').addClass(klass);
      this.search(needles);
    }
  }
})();
sitehilite.init();

