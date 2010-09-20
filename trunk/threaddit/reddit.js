var viewport=$(window).height();
var threaddit={
  options:{
    threshold:viewport-50/*2/3*/,
    autoloadBottomOffset:200,
    slideScreensPerSec:1.5,
    maxslideDuration:3,
    upboatWait:450,
    klass:'zipline'
  },
  doneGoofed:false,
  jellyTime:['z0U8W','q4aqC']
};
init();

function init(){

  var u=$('#siteTable a.author'),uid=u[0]&&u[0].className.match(/id[^\s]+/)[0]||'deleted-acount';
  var jt='http://i.imgur.com/'+threaddit.jellyTime[Math.floor(Math.random()*threaddit.jellyTime.length)]+'.gif';
  $('head').append('<style type=\'text/css\'>.content{padding-right:35px !important;}.thing.comment{position:relative;}.zipline{position:absolute;left:-9px;top:-30px;width:17px;height:100%;overflow:hidden;border-bottom:8px solid #F5F5F5;}.zipline a{margin:86px 0 8px;background-position:4px -331px !important;opacity:0.2;background-color:transparent !important;}.zipline div{height:100%;cursor:pointer;background-color:red;border:8px solid #E6E6E6;opacity:0.3;width:1px;}.zipline,.zipline div{-moz-border-radius:8px;-webkit-border-radius:8px;border-radius:8px;}.zipline:hover{border-color:#E4E4E4;}.zipline a:hover,.zipline div:hover,.zipline div.active{opacity:1;background-color:red;}.zipline div.active{width:2px;opxacity:1;}.comment .child{border-left:0}.comment{ -moz-border-radius:7px !important; -webkit-border-radius:7px !important;margin:0 0 8px 10px!important; background-color:#ffffff !important; border:1px solid #e8e8e8 !important;/*bbbcbf*/padding:5px 8px 0px 5px!important;}body>div.side{z-index:9999;position:relative;background:white url(http://imgur.com/gkzev.gif) no-repeat scroll 0 -50px;}.comment{margin-right:0px!important;}.sitetable .comment:nth-child(2n){}.comment .comment,.comment .comment .comment .comment,.comment .comment .comment .comment .comment .comment,.comment .comment .comment .comment .comment .comment .comment .comment{background-color:#F8f8F8 !important;}.comment,.comment .comment .comment,.comment .comment .comment .comment .comment,.comment .comment .comment .comment .comment .comment .comment{background-color:#ffffff !important;}a.jellyTime{font-size:medium !important;line-height:56px;padding:24px 0 2px 38px;background:url('+jt+') center left no-repeat;}img.jellyTime{height:0;left:-42px;position:absolute;}.comment .entry.self{background-color:#FFFF92;}.comment .entry.self .usertext-body{padding: 4px 0 4px 8px;}</style>');
  $('<img>').attr('src',jt).addClass('jellyTime').appendTo('body');

  (function($){var types=['DOMMouseScroll','mousewheel'];$.event.special.mousewheel={setup:function(){if(this.addEventListener)for(var i=types.length;i;)this.addEventListener(types[--i],handler,false);else this.onmousewheel=handler},teardown:function(){if(this.removeEventListener)for(var i=types.length;i;)this.removeEventListener(types[--i],handler,false);else this.onmousewheel=null}};$.fn.extend({mousewheel:function(fn){return fn?this.bind('mousewheel',fn):this.trigger('mousewheel')},unmousewheel:function(fn){return this.unbind('mousewheel',fn)}});function handler(event){var args=[].slice.call(arguments,1),delta=0,returnValue=true;event=$.event.fix(event||window.event);event.type='mousewheel';if(event.wheelDelta)delta=event.wheelDelta/120;if(event.detail)delta=-event.detail/3;args.unshift(event,delta);return $.event.handle.apply(this,args)}})($);

  $(window)
  .scroll(function(){
    if(threaddit.doneGoofed){return};
    if(typeof threaddit.scrollY=='undefined'){threaddit.scrollY=window.pageYOffset;}
    var down=(threaddit.scrollY-window.pageYOffset)<0;
    var h=$(window).height() + $(window).scrollTop();
    threaddit.scrollY=window.pageYOffset;
    if(down && $('body').height()-threaddit.options.autoloadBottomOffset <= h){
      $('.commentarea>.sitetable>.morechildren:first').find('a').html('loading some more..').addClass('jellyTime').click();
      threaddit.doneGoofed=true;
    }
  }).mousewheel(function(e, delta){
    if(e.shiftKey){
      var d=(viewport-30)*(delta>0?-1:1);
      $('html, body').stop(true, true).animate({scrollTop: $(this). scrollTop()+d}, 1000);
      //event.stopImmediatePropagation();
      return false;
    }
  });

  easyRider($('.thing.comment',document.body));
}

function easyRider(targets){
  $('.morecomments a').click(function(evt){
    var me=this,papa=$(this).parents('.morechildren').prev();
    (function(){
      if($('#'+me.id).length){
        setTimeout(arguments.callee, 200);
      }else{threaddit.doneGoofed=false;easyRider($(papa).nextAll('.thing.comment'))}
    })();
  });

  var cont='<div class='+threaddit.options.klass+'>'+'<a class=\'arrow up\' title=\'Upvote all comments in this thread\'></a><div></div>';

  $(targets).find('a.submitter').parents('.entry').addClass('self').end().end()
   .filter(function(index) {
    return this.offsetHeight > threaddit.options.threshold;
  }).prepend(cont);

  $('.'+threaddit.options.klass).find('a')
  .click(function(evt){
    if(reddit && !reddit.logged){alert('No membership, no upboat.. ');return;}
    var upboats=$(this).closest('.comment').find('div.up').get();
    (function(){
      if(upboats.length){
        $(upboats.shift()).vote('<$>votehash</$>', null, evt);
        setTimeout(arguments.callee, threaddit.options.upboatWait);
      }
    })();
    return false;
  }).end().find('div')
  .click(function(evt,wheelup){
    if($('html, body').queue('fx').length) return;
    var me=$(this).addClass('active');
    var bottomOffset=40, padding=46,up=wheelup, ot=$(this).offset().top;
	var d = ot-bottomOffset-padding;
	var t=evt.pageY-ot;
	var b=this.offsetHeight-t;
    var duration=Math.min(threaddit.options.maxslideDuration, this.offsetHeight/viewport/threaddit.options.slideScreensPerSec);
    if(b<bottomOffset+padding*3)up=true;
    if(!up)d+=this.offsetHeight-bottomOffset-padding/2;
    $('html, body').stop(true, true).animate({scrollTop: d}, duration*1000,function(){setTimeout(function(){$(me).removeClass('active')},300)});
    return false;
  })
  .mousewheel(function(event, delta) {
    $(this).trigger('click',[delta==1]);
  });
};
