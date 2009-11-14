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
      enableInput:true,
      beginsWith:true,
      endsWith:false,
      content:'body',
      colorify:false,
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
        _self.wrapWordsInDescendants(this, needleRegex, tag, klass);
      });
    },
    highlight_old_and_busted: function (context, regex, klass) {
      return jQ(context).html(jQ(context).html().replace(regex, function (a, b, c) {
        return (a.charAt(0) == '<') ? a : _self.wrap(klass, c);
      }));
    },
    dismiss: function(){
      //tear down and head east..
      document.onkeydown=this.oldOnkey;      
      jQ('._hiliteword').attr('class','');
      jQ('._hiliteCont,.sitehiliteCurtain,#sitehiliteInfo,#sitehiliteCSS').remove();
      jQ('body').removeClass('sitehiliteEnabled enableHilite '+
                'enableArrowKeys showHilitrMenu hilitetop colorify');
      
    },
    extract: function (url) {
      var where = url.toString(),s=null;
      if (where.indexOf('?') == -1) return;
      var q = where.substr(where.indexOf('?') + 1);
      q.replace(/([^=&]+)=([^&]*)/g, function (m, k, v) {
        if (_self.config.terms.test(k)) {
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
    log: function () {
      window.console && console.log(arguments);
    },    
    getEscaped: function(phrase){
      var needles=phrase
            .replace(/("|^\s+|\s+$)/g,"") //unquote,trim
            .replace(this.config.stopwords,"")
            .replace(/(['-.*+?^${}()|[\]\/\\])/g, "\\$1")//escape some
            .replace(/[\s,]+/g, "|");//expand by space and comma
            
      //filter-out digits and anything shorter than minLength chars
      return jQ.makeArray(jQ(needles.split('|')).filter(function(){
               return this.length >= _self.config.minLength &&
                 !/^\d+$/.test(this);
            }));    
    },    
    search: function (phrase, isRegex) {    
      var sense=this.config.isCasesensitive ? 'g' : 'ig';
      var pre =this.config.beginsWith?'\\b':'';
      var post=this.config.endsWith?'\\b':'';

      if(phrase){
        var needles=isRegex && phrase || [pre, '(' + this.getEscaped(phrase).join("|") + ')',post].join("");
        var regex = new RegExp(needles,sense);
        this.log(regex.toString(),'--',needles);
        this.highlight(jQ(this.config.content), regex, 'span', '_hiliteword');
        //regex=/\b((lorem( ?ipsum( ?dolor( ?sap( ?safari)?)?)?)?)|(ipsum|dolor|sap|safari))/gi
        jQ('html,body').animate({scrollTop:0},0);
      }       
      if(this.count<1){
        if(this.config.enableInput){
          this.showDialog(true);
        }  
        return;
      } 
      var o = [];
      jQ.each(this.stats.f, function (k, v) {
        _self.stats['p'][k].reverse();
        var i=0, sp="", d = [];
        sp = jQ('<span>');
        while (i++ < v) {
          if (i > 10) break;
          jQ('<a>').text(i).click((function (n) {
            return function(){_self.slideTo(n, true);}
          })(_self.stats['p'][k][i-1])).appendTo(jQ(sp));
        }
        jQ('<li>')
          .append(jQ('<small>' + k + '<em>(' + v + ')</em></small>')
          .addClass('word' + _self.stats['c'][k]))
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
            return function(){_self.slideTo(n, true);}
          })(i))
          .addClass('scrollbarMark word'+this.stats['w'][i])
        .appendTo("body");
      }
      this.currIndex=this.count+1;
      if(this.config.callback){
        try{
          this.config.callback.call();
        }catch(aarrrgh){alert('Your callback function is a no-go:'+aarrrgh)}
      }
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
        if(typeof _self.oldOnkey == 'function') {
          _self.oldOnkey(e);
        }
        if(!_self.config.enableArrowKeys){
          return;
        }

        if(a.keyCode == 37) {//left arrow
          _self.prevmatch();
        }
        else if(a.keyCode == 39 || a.keyCode==114) {//right arrow,F3
          _self.nextmatch();
        }
      }
    },
    ready: function (phrase){
      this.isbkmklet&&this.go(phrase)||
      jQ(document).ready(function(){
        _self.go(phrase);
      });
    },
    init:function(conf,phrase){
      _self = this;    
      this.count=this.wcount=this.nodes=0;
      this.config.stopwords=new RegExp('\\b('+this.config.stopwords+')\\b','ig');
      for(i in conf){
        this.config[i]=conf[i];
      }
      if(typeof jQuery == 'undefined'||jQuery.prototype.jquery<"1.2.6"){
        this.require(
          'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js',
           function(){
            jQ = jQuery.noConflict();
            _self.ready(phrase);
        });
      } else {
        jQ = jQuery;
        this.ready(phrase);
      }
    },
    showDialog: function(reveal){
      var c=jQ('#sitehiliteInfo');
      if(jQ('input',c).size()){
        jQ(c).toggle(reveal);
        return;
      }
      var a=jQ('<a>nothing happened</a>')
            .click(function(){_self.dismiss();});
      var b=jQ("<input type='button' value='Go!'>")
              .bind('click',function(){
                 jQ('._hiliteCont').show()
                     .find('li:not(._hiliteOptions)').remove();
                 jQ('#sitehiliteInfo').hide();
                 jQ('._hiliteword').attr('class','');
                 var isRegex=jQ(this).next().find('input').attr('checked');
                 _self.search(jQ(this).prev().val(),isRegex);
             });
      var lb=jQ('<label><input type="checkbox">Treat as regular expression</label>');
      jQ(c)
        .append("Oops... Couldn't find the word you were looking for..")
        .append("<br/>Pretend ").append(a)
        .append(" or enter another search below:<br/>"+
                "<input title='Partial words are OK, separate by space'"+
                " class='txt' type='text' size='38'>")
        .append(b).append(lb).show().find('input:eq(0)').focus();
        jQ('._hiliteCont').hide();
    },
    isbkmklet:true,
    go: function (what){
      var phrase = what || this.extract(document.referrer) || this.extract(document.location);
      if(!phrase && !this.config.enableInput){
        return;
      }

      if(jQ('body').hasClass('sitehiliteEnabled')){
        return this.search(phrase);
      }


      jQ('<link rel="stylesheet" href="http://means.googlecode.com/svn/trunk/sitehilite.css" id="sitehiliteCSS">').appendTo("head");
      jQ('<ul class="_hiliteCont"></ul><div id="sitehiliteInfo"></div><div class="sitehiliteCurtain"></div>').prependTo("body");
      jQ('<li>')
        .append(
          '<label><input type="checkbox" name="enableHilite" checked>Highlight ON|OFF</label>'+
          '<label><input type="checkbox" name="colorify">Colors, please!</label>'+
          '<label><input type="checkbox" name="lightsOff">Lights out</label>'+
         '<label title="Use the LEFT,RIGHT arrow keys to move back and forth">'+
          '<input type="checkbox" name="enableArrowKeys" checked>Use arrow keys</label>'+
          '<label ><input type="checkbox" name="sitehiliteContextualize" disabled>Show in context</label>'
        )
      .addClass('_hiliteOptions')
      .appendTo("._hiliteCont");
      jQ('#content').css('z-index','inherit');
      jQ('.sitehiliteCurtain').css('height',screen.height);
      jQ('._hiliteCont label input[name=colorify]').attr('checked', this.config.colorify);
      var klass='sitehiliteEnabled enableHilite '+
                (this.config.navMenu.position=='top'?'hilitetop':'hilitebottom')+
                (this.config.navMenu.show?' showHilitrMenu':'')+
                (this.config.colorify?' colorify':'');
      this.attachKeys();
      jQ('script').remove();
      jQ('body').addClass(klass);
      jQ("._hiliteCont li._hiliteOptions label")
          .slice(3).hide().end()
          .find('input').bind('change', function(){
            _self.changeIsGonnaCome(jQ(this).attr('name'),jQ(this).attr('checked'));
          });
      if(document.domain=="www.smallmeans.com"){this.config.content='#content';}
      this.search(phrase);
    }
  }
})();
sitehilite.init();