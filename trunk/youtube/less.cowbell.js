
//Youtubian v0.2, http://www.smallmeans.com/tools/youtubian
//json stuff:http://gdata.ops.demo.googlepages.com/yt_json_codelab.html

var player;
var youtube={
  errors:{
    100:'The video requested is not found (removed?)',
    101:'The video requested does not allow playback in the embedded players.',
    150:'Embedding disabled by video author.'
  },
  formats:{
    flv:{
      small: {res:'320x240', type:'FLV', ratio:'4:3', fmt:5, name:'LQ  /FLV/H.263/MP3'},
      medium:{res:'640x480', type:'FLV', ratio:'4:3, 16:9', fmt:34, name:'STDQ /FLV/H.264/AAC'},
      large: {res:'854x640', type:'FLV', ratio:'16:9', fmt:35, name:'HQ /FLV/H.264/AAC'}
   },
    mp4:{
      medium:{res:'480x360', type:'MP4', ratio:'4:3', fmt:18, name:'HQ /MP4/H.264/AAC'},  
      hd720: {res:'1280x720', type:'MP4', ratio:'16:9', fmt:22, name:'HD720p /MP4/H.264/AA'},
      hd1080:{res:'1920x1080', type:'MP4', ratio:'16:9', fmt:37, name:'HD1080p/MP4/H.264/AAC'}
   },
    _3gp:{
      medium:{res:'176x144', type:'3GP', ratio:'11:9', fmt:17, name:'Mobile/3GP/MPEG4/AAC'}
   }
  },
  config:{
    sticky:false
  },
  history:{},
  require: function (src, callback) {
    var c = document.createElement("script");
    c.src = src;
    c.type = "text/javascript";
    if (callback) {
      c.onload = callback;
    }
    document.getElementsByTagName("head")[0].appendChild(c);
  },
  log: function () {
    window.console && console.log(arguments);
  },
  commafy:function(v){
    return String(v).replace(/(^|[^\w.])(\d{4,})/g, function($0,$1,$2){
      return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,");
    });
  },
  formatDate:function(s){
    var time =  s .replace(/-/g,"/").replace(/T|\..+Z$/g," ");
    var d= new Date(time).toGMTString().split(" ");
    return d[1] + " " + d[2] + " " + d[3];
  },
  secondsToStamp:function(secs){
    var res=[], hours = Math.floor(secs/(60*60));
    var m = secs%(60*60);
    var minutes = Math.floor(m/60);
    var seconds = Math.ceil(m%60);
    hours && res.push(hours);
    res.push(minutes, seconds>9?seconds:'0'+seconds)
    return res.join(':');
  },
  stampToSeconds:function(stamp){
    var a=stamp.split(':');
    return a.length>2?1*a[0]*60*60+1*a[1]*60+1*a[2]:1*a[0]*60+1*a[1];
  },
  roundToHalf:function(value){
    var converted = parseFloat(value);
    var decimal = (converted - parseInt(converted, 10));
    decimal = Math.round(decimal * 10);
    if (decimal == 5) { return (parseInt(converted, 10)+0.5); }
    if ( (decimal < 3) || (decimal > 7) ) {
      d=Math.round(converted);
    }else{
      d=(parseInt(converted, 10)+0.5);
    }
    return d.toFixed(1);
  },
  getNeedle:function (needle, hayStack){
    var regex= new RegExp("\\b"+needle+"=([^&#$)]*)",'ig');
    var m=regex.exec(unescape(hayStack));
    return m && m[1];
  },
  clickIt:function(el){
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent("click", true, true);
    el && el.dispatchEvent(evt); 
  },
  getFlashVar:function(name){
    var o=jQuery("#watch-player-div embed").attr('flashvars');
    return this.getNeedle(name, o);
  },
  assign:function(variables, values, scope){
    for(var i = 0; i < variables.length && i < values.length; i++){
      (scope || this)[variables[i]] = values[i];
    }
  },
  getMetaData:function(o){
    var t=o.title.$t;
    var i=this.getNeedle('v', o.link[0].href);
    var d=o.media$group.media$description.$t.replace(/\r\n/g,'<br/>')||'';/*this.errors[150]*/
    var p=o.published.$t;
    var u=o.author[0].name.$t;
    var ui=o.author[0].uri.$t;
    var r=o.gd$rating && o.gd$rating.numRaters || 0;
    var a=o.gd$rating && o.gd$rating.average || 0;
    var c=o.gd$comments && o.gd$comments.gd$feedLink.countHint || 'none';
    var v=o.yt$statistics && o.yt$statistics.viewCount || 0;
    var th=o.media$group.media$thumbnail;
    var du=o.media$group.yt$duration&&o.media$group.yt$duration.seconds;
    return {id:i,title:t,desc:d,pdate:p,user:u,useri:ui,thumbs:th,duration:du,
            comm:this.commafy(c),views:this.commafy(v),rates:r,avgrate:a};

  },
  getVideoEntryDOM:function(entry){
    var t= this.getMetaData(entry);
    var thumb=t.thumbs[0].url;
    var dur=this.secondsToStamp(t.duration);       
    return '<div class="video-entry">'+
               ' <a class="video-thumb-90" href="/watch?v='+t.id+'">'+
               '  <img alt="'+t.title+'" title="'+t.title+'" qlicon="'+t.id+'" class="vimg90" src="'+thumb+'"/>'+
               '  <span class="video-time"><span>'+dur+'</span></span></a>'+
               ' <div class="video-main-content">'+
               '   <div class="video-mini-title"><a title="'+t.title+'" href="/watch?v='+t.id+'">'+t.title+'</a></div>'+
               '   <div class="video-view-count">'+t.views+' views</div>'+
               '   <div class="video-username"><a href="/user/'+t.user+'">'+t.user+'</a></div>'+
               ' </div>'+
               ' <div class="video-clear-list-left"/>'+
            '</div>';
  },
  setVideoData:function(data){
    this.log(data);
    var t= this.getMetaData(data.entry);
    var avg=this.roundToHalf(t.avgrate);
    $('.watch-video-desc span.description').html(t.desc);
    $('#watch-channel-icon img.photo').attr('src',t.thumbs[0].url||'');
    $('#watch-channel-icon a.url,#watch-channel-stats>a')
     .attr('href','/user/'+t.user).filter('.hLink').text(t.user);
    $('#watch-channel-stats span.watch-video-added').text(this.formatDate(t.pdate));
    $('#watch-comment-panel h4 span.expander-head-stat').text('('+t.comm+')');
    $('#newContent .tabs > a[name=comments] small').text(t.comm);
    $('#defaultRatingMessage span').text(this.commafy(t.rates)+' ratings');
    $('#ratingStars').html($('<button>').attr('title',avg)
       .attr('class','master-sprite ratingL ratingL-'+avg));
    $('#_loadingInfo').addClass('info');
  },
  requestVideo:function(id, user){
    $('#grabVideos').attr('class','');
    $('#newContent span a').removeClass('active');
    $('#_loadingInfo').attr('class','visible');
    this.playNice=false;
    this.playVideo(id);
    this.getVideoData(id);
    this.getVideoComments(id);
    if(!this.config.sticky){
      this.getRelatedVideos(id);
    }else{
      $('#_loadingInfo').addClass('related');
    }
    if(user && !this.config.sticky){
      this.getUserChannel(user);
    }else{
      $('#_loadingInfo').addClass('user');
    }
    var targetOffset = $('#baseDiv').offset().top;
    $('html,body').animate({scrollTop: targetOffset}, 1000);
  },
  onClick:function(context){
    var css=".video-entry > a, .video-entry .video-mini-title a";
    var selection=$(css, context);
    this.log(context+':'+selection.length);
    if(!selection.length){
      //not there yet.. take a nap.
      setTimeout(function(){self.onClick(context);}, 1100);
      return;
    }
    this.addMetaData(context);
    selection.live("click",function(e){
      if(e.button!=0){return true;}//Firefox righ click bug
      var id=$(this).getVideoID();
      var parent=$(this).parents('.video-entry');
      var views=$(parent).find('.video-view-count').text();
      var user=$(parent).find('.video-username').text();
      var th=$(parent).find('>a img').attr('src');
      $('#watch-views').text(views);
      $(parent).activate();
      self.current=id;
      var title=$(this).find('img').attr('title')||$(this).attr('title');
      self.setTitle(title);
      self.addHistory({t:title, i:id, u:user, th:th});
      self.requestVideo(id,user);
      return false;
    });
  },
  addHistory:function(obj){
    $('<a href="/watch?v='+obj.i+'" title="'+obj.t+'">')
       .data('stuff',obj)
       .append('<img src="'+obj.th+'"/></a>')
    .prependTo('.historyContainer div'); 
  },
  setTitle:function(title){
    $('#watch-vid-title h1').text(title);
    document.title='Youtube - '+title;
  },
  getVideoData:function(id){
    this.require("http://gdata.youtube.com/feeds/api/videos/"+id+
                 "?alt=json&callback=youtube.setVideoData");
  },
  getRelatedVideos:function(id){
    this.require("http://gdata.youtube.com/feeds/videos/"+id+"/related?"+
                 "max-results=20&alt=json&callback=youtube.listRelatedVideos");
  },
  searchVideos:function(term){
    this.require("http://gdata.youtube.com/feeds/api/videos?max-results=40&start-index=1&"+
                 "v=2&q="+term+"&safeSearch=none&alt=json&callback=youtube.listResultVideos");
  },
  listResultVideos:function(data){
    self.listVideos(data, '#watch-result-discoverbox');
    var total=self.commafy(data.feed.openSearch$totalResults.$t);
    $('#newContent .tabs > a[name=results]').removeClass('waiting').find('small').text(total);
  },
  listRelatedVideos:function(data){
    $('#_loadingInfo').addClass('related');
    self.listVideos(data, '#watch-related-discoverbox');
    var l=data.feed.link[0].href;
    var s="See all "+data.feed.openSearch$totalResults.$t+" related videos";
    $('.watch-discoverbox-more-link.related a').attr('href',l).text(s);
  },
  listVideos:function(data, container){
    self.log(data.feed);
    var entries = data.feed.entry || [];
    var next = data.feed.link[4]&&data.feed.link[4].href || '';
    var html = [], content='';
    for (var i = 0, entry; entry = entries[i]; i++) {
      //callback context is now window
      content = self.getVideoEntryDOM.apply(self, [entry]);
      html.push(content);
      //if(!entry.yt$noembed)
    }
    $(container).html(html.join(''));
    self.onClick(container);
  },
  getUserChannel:function(user){
    var url="/watch_ajax";
    var args={
      user:user,
      video_id:self.current,
      action_channel_videos:1
    };
    $.get(url, args,function(xml){
      $('#_loadingInfo').addClass('user');
      $("#watch-channel-vids-body").html($(xml).find('html_content').text());
      yt.net.delayed.load('channel');
      //self.onClick('#watch-channel-vids-body');
      self.addMetaData('#watch-channel-vids-body');
      $('.watch-discoverbox-more-link.user')
         .html($('#watch-channel-vids-body .watch-discoverbox-more-link a').attr('target','_blank').remove());
    },'xml');
  },
  getVideoComments:function(id){
/*
	yt.setConfig({
	  'VIDEO_ID':id,
	  'COMMENTS_THRESHHOLD': -5,
	  'COMMENTS_FILTER': 0,
          'COMMENTS_MAX_PAGE': 2155,
	  'COMMENTS_PAGE_SIZE': 10
	});
	yt.www.comments.viewing.onWatchCommentsShowMore();
*/
    var count=10;
    var url="/watch_ajax";
    var args={
      v:id,
      action_get_comments:1,
      p:1,
      commenatthreshold:-5,
      commentfilter:0,
      page_size:count
    };
    yt.setConfig('VIDEO_ID', id);
    $.get(url, args,function(xml){
      $("#recent_comments").html($(xml).find('html_content').text());
      $('#_loadingInfo').addClass('comments');$('#more-comments').hide();
    },'xml');

  },
  goPop:function(url){
    var w=window.open(url,
    "gogetter..","menubar=1,resizable=1,width=350,height=250"); 
    if(window.focus){w.focus()}
  },
  getDownloadURL:function (vId, t, format) {
    //http://www.youtubemp4.com/video/${vId}.mp4
    return  "/get_video?video_id=" + vId + "&t=" + t + ((format == "") ? "" : "&fmt=" + format);
  },
  getVideoToken:function (format,callback) {
    var url="/get_video_info?video_id="+self.current;
    $.get(url,function(data){
      var token=self.getNeedle('token', data);
      var uri=self.getDownloadURL(self.current, token, format);
      callback && callback(uri);
    });
  },
  makeArray:function(obj) {
    var a=[];
    $.each(obj,function(k,v){
      a.push(v);
    });
    return a;    
  },
  playVideo:function(id, from, quality) {
    if(!player||!player.loadVideoById){
      if(!self.playNice){
        this.yell('hold on, the tubes are still clogged..');
      }self.playNice=true;
      setTimeout(arguments.callee, 1100);
      return;
    }
    awaiting=true;
    player.loadVideoById(self.current);
  },
  setHD:function() {
    player.setPlaybackQuality('hd720');
  },
  getMB:function(val) {
    return (1*val/1024/1024).toFixed(2);
  },
  getSize:function(){
    return this.getMB(player.getVideoBytesTotal());
  },
  getBytesLoaded:function(){
    return this.getMB(player.getVideoBytesLoaded());
  },
  getCurrentTime:function(){
    return player.getCurrentTime();
  },
  initplayer:function(currentVideoID) {
    this.current=currentVideoID;
    var p='<object height="100%" width="100%" type="application/x-shockwave-flash"'+
          'id="movie_player" data="/v/'+currentVideoID+'?enablejsapi=1">'+
          '<param name="allowScriptAccess" value="always"/>'+//mucho importante!
          '<param name="wmode" value="opaque"/></object>';
    $('#watch-player-div').html(p);
  },
  sortByDuration:function(){
    jQuery("#newContent .video-entry").tsort(".video-time",{order:"desc",attr:"duration"});
  },
  sortByViews:function(){
    jQuery("#newContent .video-entry").tsort(".video-view-count",{order:"desc",attr:"views"});
  },
  videoReady:function(){
    var c=this.makeArray(player.getAvailableQualityLevels());
    c.push('small','_3gp');
    $('#grabVideos').attr('class',c.join(' '));
    this.available=c;
  },
  addMetaData:function(context){
    $('.video-entry .video-view-count', context || '').each(function(){
      var views=$(this).text().split(' ')[0].replace(/,/g,'');
      $(this).attr('views',views);
    });
    $('.video-entry .video-time', context || '').each(function(){
     var duration=youtube.stampToSeconds($(this).find('span').text());
      $(this).attr('duration',duration);
    });
  },
  yell:function(msg){
    $('.humanized_msg').text(msg).fadeIn('slow');
    setTimeout(function(){$('.humanized_msg').fadeOut()}, 2300);
  },
  onPlayerError:function(code){
    self.yell(this.errors[code] || 'Gah! Unknown error occured.')
  },
  updatePlayerInfo:function(){
    $('#loadvidsize').text(this.getBytesLoaded());
    $('#vidsize').text(this.getSize());
    $('#pointLink').attr('href','/watch?v='+this.current+'#t='+this.getCurrentTime());
  },
  onPlayerStateChange:function(state){
    if(!awaiting) return;
    switch(state){
      case 5://cue state
       awaiting=true;
      break;
      case 1://play
       if(awaiting){
         self.videoReady.call(self);
       }
       awaiting=false;
      break;
    }
  },
  init:function(){
    self=this;
    this.yell('Loading stuff.. hold your breath..');
    this.initplayer(this.getNeedle('v',document.location));
  }
}
//callback when player is ready
// the native one works fine in Firefox but 
// is never called in Safari or Chrome... arrgh!
onYouTubePlayerReady=function(playerId) {
  player=jQuery("#movie_player").get(0);
  player.addEventListener("onError", "youtube.onPlayerError"); 
  player.addEventListener("onStateChange", "youtube.onPlayerStateChange");
  setInterval(function(){self.updatePlayerInfo()}, 500);
  youtube.playVideo(youtube.current);
}

youtube.require(
  'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js',
  function(){
    youtube.require('http://means.googlecode.com/svn/trunk/youtube/jquery.tinysort.min.js');
    (function($){
      $.fn.extend({
        hasFocus: function (a) {
            return elem.hasFocus
        },
        getVideoID: function(){
          return $(this).is('a') &&
           youtube.getNeedle('v',$(this).attr('href'));
        },
        activate: function(isvideo){
          var c='active been-there';
          if($(this).is('.video-thumb-90')){
            $('.video-entry .video-thumb-90').removeClass('active');
            $(this).addClass(c);
          }else{
            $(this).siblings().removeClass('active').end().addClass(c);
          }
        },
        reverse: function(){
          return this.pushStack(this.get().reverse(), arguments)
        }
      });
      youtube.clickIt($('#watch-channel-videos-panel h2')[0]);

      $('<link rel="stylesheet" type="text/css" href="http://means.googlecode.com/svn/trunk/youtube/less.cowbell.css"/>').appendTo("head");
      // $('<link rel="stylesheet" type="text/css" href="http://www.smallmeans.com/apps/sitehilite/youtube/less.cowbell.css"/>').appendTo("head");

      $('<div class="humanized_msg"><p></p></div>').prependTo('body');
      $('#watch-other-vids >div:gt(1)').hide()
      $('#watch-comment-panel').wrap("<div id='newContent'>");
      $("#watch-related-discoverbox").remove().appendTo("#newContent");
      $("#watch-channel-vids-body").remove().appendTo("#newContent");
      $('#watch-ratings-views').remove().appendTo('#watch-this-vid');
      $("#watch-related-discoverbox").after(
          '<div id="watch-result-discoverbox" class="watch-discoverbox">'+
          '<div class="_loadingInfo">....if you\'re reading this, it is a slow day at work..</div></div>');
      $("#watch-this-vid").append(
          '<div id="_loadingInfo">Hard at work getting <span class="info">video info</span>, '+
          ' <span class="comm">comments</span>, <span class="user">user channel</span>'+
          ' and <span class="related">related videos</span></div>');

      $("<div class='tabs'>"+
           "<span>Order videos by: <a href='#'>views</a><a href='#'>duration</a></span>"+
           "<a href='#' name='related'>Related videos</a>"+
           "<a href='#' name='user'>More from user</a>"+
           "<a href='#' name='comments' title='View at own peril'>Comments <small></small></a>"+
           "<a href='#' name='results'>Results <small title='Results'></small></a>"+
         "</div>")
        .prependTo('#newContent');
      $("<a href='#'>Expand</a>").addClass('headcoll').click(function(){
          $("#masthead").slideToggle();
      }).prependTo("#masthead-container");

      $('#watch-channel-vids-div').after(
		"<div> Video: <b id='loadvidsize'>0 byes</b> of <span id='vidsize'>N/A</span> megabytes in cache</div>"+
                "<div> Link to this point of the video: <a id='pointLink' href='#'></a></div>"+
                "<table id='grabVideos'><caption><span></span>Download video<small>"+
                "in High quality and high definition</small></caption>"+
                "<tr><th colspan='3'>Flash video</th><th class='divider'/>"+
                "<th colspan='2'>MPEG-4</th><th class='divider'/><th colspan='2'>Mobile</th></tr>"+
                "<tr><td class='small flv'>LQ</td><td class='medium flv'>Normal</td><td class='large flv'>HQ</td>"+
                "<td class='divider'/><td class='medium mp4'>HQ</td><td class='hd720 mp4'>HD</td>"+
                "<td class='divider'/><td class='medium _3gp'>3gp</td></tr></table>"

      );
      $('#masthead').prepend('<p class="info">All links in this section work like regular ones, so be warned.</p>');
      var hist=$('<a class="yhistory"><span/>Been there, seen that</a>')
                 .attr('title', 'Videos watched in this session')
                 .click(function(){$('.historyContainer').slideToggle();});
      $('#watch-views-div').after(hist);
      $("#grabVideos td:not(.divider)").click(function(){
        var c=$(this).attr('class').split(' '), s=c[0],f=c[1];
        var fmt=self.formats[f][s] && self.formats[f][s].fmt || '';
        if(!fmt){self.yell('Unknown format or video size');return;}
        if($.inArray(s, self.available)<0){
          self.yell('Sorry, video not available in that format.')
        }else{
          self.yell('Requesting video, please hold..');
          self.goPop('/get_video');
          self.getVideoToken(fmt, self.goPop);
        }
        return false;
      });
      $('#watch-channel-stats span.watch-video-added').attr('title','Date and time in GMT');
      $('#newContent .tabs > a[name=results]').hide();
      $('#newContent').addClass('related').find('.tabs > a:eq(0)').addClass('active');
      $('#newContent .tabs span a:eq(0)').click(function(){
        youtube.sortByViews();
        $(this).activate();
        return false;
      });    
      $('#newContent .tabs span a:eq(1)').click(function(){    
        youtube.sortByDuration();
        $(this).activate();
        return false;
      });    

      $('#newContent .tabs > a').click(function(){
        $(this).parent().parent().attr('class', $(this).attr('name'));
        $(this).activate();
        if($(this).attr('name')=='user'){
          yt.net.delayed.load('channel');
        }
        return false;
      });

      setTimeout(function(){
        $('.watch-discoverbox-more-link:not([id*=loading])').each(function(i){
          var c=i>0?'user':'related';
          $(this).addClass(c).find('a').attr('target','_blank');
      }).remove().appendTo('#newContent')},3000);
      $('#pointLink').attr('target','_blank');
      $('#_loadingInfo').before('<div class="historyContainer"><div/>'+
        '<a href="#" class="r"/><a href="#" class="l"/></div>');
      $('.historyContainer div a').live('click',function(){
        var o=$(this).data('stuff');
        self.current=o.i;
        self.requestVideo(o.i,o.u);
        self.setTitle(o.t);
        return false;
      })
      $('#watch-video-details-toggle a:eq(0)').get(0).onclick=function(){
        $('.watch-video-desc:eq(0)').toggleClass('expand');
        return false;
      }
      $('#watch-channel-icon a.url,#watch-channel-stats>a')
       .click(function(){
         $('html,body').animate({scrollTop: $('#ratingWrapper').offset().top},1000,
           function(){$('#newContent .tabs > a[name=user]').click()}
         );
         return false;
      });
      $('#watch-channel-vids-div').before($('#masthead-search form.search-form').clone(true));
      $('#watch-other-vids .search-form').submit(function(){
        var s=$(this).find('input:eq(0)').val();
        if(s&&$.trim(s).length){
          self.searchVideos(s);
          $('#_loadingInfo')[0].scrollIntoView();
          $('#newContent .tabs > a[name=results]').find('small').text('loading..').end().
             addClass('waiting').click().show();
        }
        return false;
      }).find('a').click(function(){
        $(this).parent().submit();
        return false;
      })

      setTimeout("yt.net.delayed.load('channel')", 2000);
      yt.net.delayed.load('related');
      youtube.onClick('#watch-related-discoverbox');              
      youtube.onClick('#watch-channel-vids-body');
      youtube.init();
      //yt.www.watch.player.enableWideScreen(!_hasclass(_gel('baseDiv'), 'watch-wide-mode'), true);
  })(jQuery);
});
           
