
//Youtubian v1.2, 26 Aug 2010
// http://www.smallmeans.com/tools/youtubian


var player,
youtube={
  errors:{
    100:'The video requested is not found (removed?)',
    101:'The video requested does not allow playback in the embedded players.',
    150:'Embedding disabled by video author.'
  },
  formats:{
    flv:{
      small: {res:'320x240', type:'FLV', ratio:'4:3', fmt:5, name:'LQ /FLV/H.263/MP3'},
      medium:{res:'640x480', type:'FLV', ratio:'4:3, 16:9', fmt:34, name:'STDQ /FLV/H.264/AAC'},
      large: {res:'854x640', type:'FLV', ratio:'16:9', fmt:35, name:'HQ /FLV/H.264/AAC'}
   },
    mp4:{
      medium:{res:'480x360', type:'MP4', ratio:'4:3', fmt:18, name:'HQ /MP4/H.264/AAC'},  
      hd720: {res:'1280x720', type:'MP4', ratio:'16:9', fmt:22, name:'HD720p /MP4/H.264/AA'},
      hd1080:{res:'1920x1080', type:'MP4', ratio:'16:9', fmt:37, name:'Full HD: 1080p/MP4/H.264/AAC'}
   },
    _3gp:{
      small:{res:'176x144', type:'3GP', ratio:'11:9', fmt:17, name:'Mobile/3GP/MPEG4/AAC'}
   }
  },
  config:{maxFavd:20,maxPagination:25},pagination:{},
  log:function() {
    //typeof console!=="undefined" && console.log && console.log([].slice.call(arguments));
  },
  require: function (src, callback) {
    var c = document.createElement("script");

    c.type = "text/javascript";
    if (callback) {
      c.onload = callback;
      c.onreadystatechange=function(){
        if(c.readyState == 'loaded' || c.readyState == 'complete'){
          callback();
        }
      }
    }c.src = src;
    document.getElementsByTagName("head")[0].appendChild(c);
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
    var res=[], hours = Math.floor(secs/(60*60)),m = secs%(60*60);
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
  getNeedle:function (needle, hayStack){
    var regex= new RegExp("\\b"+needle+"=([^&#$)]*)",'ig');
    var m=regex.exec(unescape(hayStack));
    return m && m[1];
  },
  getFlashVar:function(name){
    var o=$(player).attr('flashvars');
    return this.getNeedle(name, o);
  },
  getMetaData:function(o){
    var t=o.title.$t;
    var i=this.getNeedle('v', o.link[0].href);
    var d=o.media$group.media$description && o.media$group.media$description.$t.replace(/\r\n/g,'<br/>')||'';
    var p=o.published.$t;
    var u=o.author[0].name.$t;
    var ui=o.author[0].uri.$t;
    var r=o.gd$rating && o.gd$rating.numRaters || 0;
    var a=o.gd$rating && o.gd$rating.average || 0;
    var nay=o.yt$rating && o.yt$rating.numDislikes || 0;
    var yay=o.yt$rating && o.yt$rating.numLikes || 0;
    var c=o.gd$comments && o.gd$comments.gd$feedLink.countHint || 'none';
    var v=o.yt$statistics && o.yt$statistics.viewCount || 0;
    var th=o.media$group.media$thumbnail;
    var du=o.media$group.yt$duration&&o.media$group.yt$duration.seconds;
    return {id:i,title:t,desc:d,pdate:p,user:u,useri:ui,thumbs:th,duration:du,
            comm:this.commafy(c),views:this.commafy(v),rates:r,avgrate:a,nay:nay,yay:yay};

  },
  setVideoData:function(data){
    this.log(data);
    var t= this.getMetaData(data.entry);
    $('#eow-description-short').html(t.desc);
    $('#watch-channel-icon img.photo').attr('src',t.thumbs[0].url||'');
    var avg=t.avgrate,nayp=+(t.nay/t.rates)*100+'%',yayp=+(t.yay/t.rates)*100+'%';
    $('#watch-description a.watch-description-username')
     .attr('href','/user/'+t.user).text(t.user);
    $('#eow-date-short').text(this.formatDate(t.pdate));
    $('#newContent .tabs > a[name=comments] small').text(t.comm);
    $(classes.watchRatingStats).find('.likes-bar').css('width',yayp);
    $(classes.watchRatingStats).attr('title',this.commafy(t.yay)+' likes, '+this.commafy(t.nay)+' dislikes.').find('.dislikes-bar').css('width',nayp);
    $('#_loadingInfo').addClass('info');
  },
  requestVideo:function(id, user){
    $('#grabVideos').attr('class','');
    $('#newContent span a').removeClass('active');
    $('#_loadingInfo').attr('class','visible');
    this.stopMiniVideo();
    this.playNice=false;
    this.playVideo(id);
    this.getVideoData(id);
    this.getVideoComments(id);
    if(!this.config.sticky){
      this.getRelatedVideos(id);
      if(user){
        this.getUserChannel(user);
      }else{
        $('#_loadingInfo').addClass('user');
      }
    }else{
      $('#_loadingInfo').addClass('related user');
    }
    if($.browser.opera){
      $(classes.watchMainContainer).get(0).scrollIntoView()
    }else{
      var rm=$(classes.watchEmbedParent).removeClass('shadow');
      var targetOffset = $(classes.watchMainContainer).offset().top;
      $('html,body').animate({scrollTop: targetOffset}, 1000,function(){rm.addClass('shadow')});
    }
    this.awaitState(1,this.videoReady);
  },
  awaitState:function(state,callback){
    (function(){
      var s=player.getPlayerState&&player.getPlayerState()||NaN;_self.log('state:',s);
      if(state==s){callback.apply(_self);}else{setTimeout(arguments.callee, 200);}
    })();
  },
  OnClick:function(elem,evt){
      if(evt.button!=0){return true;}//Firefox righ click bug
      var id=$(elem).getVideoID(),p=$(elem).parent();
      var views=p.find('.view-count').text().split(' ')[0];
      var user=p.find('.stat:first').text().split(' ').reverse()[0];
      var th=p.find('img').attr('src');
      var title=p.find('img').attr('title'),context='#'+p.parent()[0].id;
      $(classes.watchViewsStats).find('strong').text(views);
      $(p).activate();
      _self.current=id;_self.user=user;
      _self.setTitle(title);
      _self.addHistory({t:title, i:id, u:user, th:th});
       if(classes.watchChannelVidsBody==context){user=null;};
      _self.requestVideo(id,user);
      delete _self.pagination[context];
  },
  addOnClick:function(context){
    var css=".video-list-item > a";
    var selection=$(css, context);
    this.log(context+':'+selection.length);
    this.addMetaData(context);
    selection.live("click",function(e){
      _self.OnClick(this,e);
      return false;
    });
  },
  addHistory:function(obj){
    $('<a href="/watch?v='+obj.i+'">')
       .data('stuff',obj)
       .attr('title',obj.t).attr('target','_blank')
       .append('<img src="'+obj.th+'"/></a>')
    .prependTo('.historyContainer div'); 
  },
  setTitle:function(title){
    $(classes.headlineParent+' h1').text(title);
    document.title='Youtube - '+title;
  },
  get:function(url, callback){
    url+='&callback=?'
    $.getJSON(url,function(xhr) {callback(xhr)});
  },
  getVideoData:function(id){
    this.get("http://gdata.youtube.com/feeds/api/videos/"+id+"?v=2&alt=json", function(d){_self.setVideoData.apply(_self, [d])});
  },
  getUserChannel:function(username, index){
    var from=index||1,order='viewCount';//relevance,published,rating,viewCount
    this.get("http://gdata.youtube.com/feeds/api/users/"+username+"/uploads?"+
                 "max-results="+this.config.maxChannel+"&start-index="+from+"&orderby="+order+"&alt=json",youtube.listChannelVideos);
  },
  getFavoritedVideos:function(username){
    this.get("http://gdata.youtube.com/feeds/api/users/"+username+"/favorites?"+
                 "max-results="+this.config.maxFavd+"&alt=json",youtube.listFavdVideos);
  },
  getRelatedVideos:function(id,index){
    var from=index||1;
    this.get("http://gdata.youtube.com/feeds/videos/"+id+"/related?"+
                 "max-results="+this.config.maxRelated+"&start-index="+from+"&alt=json",youtube.listRelatedVideos);
  },
  getSearchVideos:function(term,index){
    var from=index||1,order=this.config.searchOrder;this.s=term;
    this.get("http://gdata.youtube.com/feeds/api/videos?max-results="+this.config.maxSearch+"&start-index="+from+
                 "&v=2&q="+term+"&orderby="+order+"&safeSearch=none&alt=json",youtube.listResultVideos);
  },
  listChannelVideos:function(data){
      $('#_loadingInfo').addClass('user');
    _self.listVideos(data, classes.watchChannelVidsBody);
  },
  listResultVideos:function(data){
    _self.listVideos(data, '#watch-result-discoverbox');
    var total=_self.commafy(data.feed.openSearch$totalResults.$t);
    $('#newContent .tabs > a[name=results]').removeClass('waiting').find('small').text(total);
    var l="/results?search_query="+_self.s;
    var s="See all "+total+" videos for: "+_self.s;
    $('.watch-discoverbox-more-link.results a').attr('href',l).text(s);
  },
  listRelatedVideos:function(data){
    $('#_loadingInfo').addClass('related');
    _self.listVideos(data, classes.watchRelatedDiscoverbox);
    var l=data.feed.link[0].href;
    var s="See all "+data.feed.openSearch$totalResults.$t+" related videos";
    $('.watch-discoverbox-more-link.related a').attr('href',l).text(s);
  },
  listVideos:function(data, container){
    _self.log(container,data.feed);
    var entries = data.feed.entry || [];
    var next = data.feed.link[4]&&data.feed.link[4].href || '';
    var total = data.feed.openSearch$totalResults.$t || 0;
    var ppage = data.feed.openSearch$itemsPerPage.$t || 0;
    var html = [], buttons=[],content='';
    for(var i=0, entry; entry = entries[i]; i++){
      content = _self.getVideoEntryDOM.apply(_self, [entry]);
      html.push(content);
    }
    for(var i=1, k= Math.min(_self.config.maxPagination,Math.ceil(total/ppage)); i<=k; i++){
      buttons.push('<button class="yt-uix-button">'+i+'</button>');
    }
    var current=_self.pagination[container]||1;
    $(container).html(html.join(''));
    if(k>1)$("<div class='yt-uix-pager'>").html(buttons.join('')).find('button').eq(current-1).addClass('yt-uix-pager-selected').end().end().appendTo(container);
    _self.addMetaData(container);
  },
  getVideoComments:function(id){
    var url="/watch_ajax";
    var args={v:id, action_get_comments:1, p:1,  commenatthreshold:-5, commentfilter:0, page_size:10};
    $.get(url+'?'+$.param(args),function(xml){
      $(classes.watchCommentPanel).html($(xml).find('html_content').text())
       .find('a').attr('target','_blank').end().find('.video-list').remove();
      $('#_loadingInfo').addClass('comments');
    });
  },
  getVideoStatsData:function(id){
    var url="/watch_ajax";
    var args={v:id||_self.current, action_get_statistics_and_data:1};
    $(classes.watchStatsExtended).show().addClass('expanded').html('<div id="watch-stats-loading">Loading...</div>');
    $.get(url+'?'+$.param(args),function(xml){
      $(classes.watchStatsExtended).html($(xml).find('html_content').text());
    });
  },
  getVideoEntryDOM:function(entry){
    var t= this.getMetaData(entry);
    if(!t.thumbs) return '';
    var thumb=t.thumbs[0].url;
    var dur=this.secondsToStamp(t.duration);
	return '<li class="video-list-item ">'+
		' <a href="/watch?v='+t.id+'" class="video-list-item-link">'+
		'  <span class="video-thumb ux-thumb-94 ux-thumb-96">'+
		'   <span class="img"><img alt="'+t.title+'" title="'+t.title+'" class="vimg90" src="'+thumb+'"/></span>'+
		'   <span class="video-time">'+dur+'</span></span>'+
		'  <span title="'+t.title+'" class="title video-mini-title">'+t.title+'</span>'+
		'  <span class="stat video-username">'+t.user+'</span>'+
		'  <span class="stat view-count">'+t.views+' views</span>'+
		' </a>'+
		'</li>';
  },
  goPop:function(url){
    _self.w=window.open(url,
    "gogetter..","menubar=1,resizable=1,width=480,height=150"); 
    if(window.focus){try{_self.w.focus()}catch(c){}}
  },
  getDownloadURL:function (vId, t, format) {
    return  "/get_video?video_id=" + vId + "&asv=&t=" + t + ((format == "") ? "" : "&fmt=" + format);
  },
  getVideoToken:function (format,callback) {
    var url="/get_video_info?asv=&noflv=1&video_id="+_self.current;
    $.get(url, function(data){
      var token=_self.getNeedle('token', data);
      _self.log(url,'>>>',data,token)
      if(!token){_self.yell(_self.getNeedle('reason', data).replace(/\+/g,' '),true);try{_self.w.close()}catch(c){};return;}
      var uri=_self.getDownloadURL(_self.current, token, format);
      callback && callback(uri);
    });
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
  sortByDuration:function(){
    jQuery("#newContent .video-list-item").tsort(".video-time",{place:"end",order:"desc",attr:"duration"});
  },
  sortByViews:function(){
    jQuery("#newContent .video-list-item").tsort(".view-count",{place:"end",order:"desc",attr:"views"});
  },
  videoReady:function(){
    var c=player.getAvailableQualityLevels();
    c.push('small','_3gp');
    $('#grabVideos').attr('class',c.join(' '));
    this.available=c;
    this.log('available:',c);
    setInterval(function(){_self.updatePlayerInfo();}, 500);
  },
  addMetaData:function(context){
    $('.video-list-item .view-count', context).each(function(){
      var views=$(this).text().split(' ')[0].replace(/,/g,'');
      $(this).attr('views',views);
    });
    $('.video-list-item .video-time', context).each(function(){
     var duration=_self.stampToSeconds($(this).text());
      $(this).attr('duration',duration);
    });
  },
  yell:function(msg,longr){
    $('.humanized_msg').html(msg).fadeIn('slow');clearInterval(_self.td);
    _self.td=setTimeout(function(){$('.humanized_msg').fadeOut()}, longr?3200:2300);
  },
  updatePlayerInfo:function(){
    if(!player.getVideoBytesLoaded)return;
    $('#loadvidsize').text(this.getBytesLoaded());
    $('#vidsize').text(this.getSize());
    $('#deepLink').attr('href','/watch?v='+this.current+'#t='+Math.round(this.getCurrentTime()));
  },
  stopMiniVideo:function(el){
    try{_self.p.stopVideo && _self.p.stopVideo();_self.p.mute();_self.p.loadVideoById(1);}catch(c){};
    $('#onHoverPlayer').css('visibility','hidden');
  },
  playVideo:function(id, from, quality) {
   (function(){
     if(!player||!player.loadVideoById){
      if(!_self.playNice){_self.yell('hold on, the tubes are still clogged..');}_self.playNice=true;
      setTimeout(arguments.callee, 500);
     }else{player.loadVideoById(id||_self.current);}
    })();
  },
  init:function(videoID){
    var o={
     t:document.title, u:this.user,
     i:videoID,th:'http://i2.ytimg.com/vi/'+videoID+'/default.jpg'
    };
    this.addHistory(o);  
    _self.getUserChannel(this.user);
    this.current=videoID;
    _onYouTubePlayerReady.apply(this);
  }
},
classes={
  watchMainContainer:'#watch-container',
  watchEmbedParent:'#watch-player',
  watchCommentPanel:"#watch-discussion",
  watchRelatedDiscoverbox:'#watch-related',
  watchChannelVidsBody:'#watch-channel-discoverbox',
  watchResultDiscoverbox:'#watch-result-discoverbox',
  watchViewsStats:'#watch-views',
  watchRatingStats:'#watch-actions-left',
  watchStatsPanel:'#watch-actions',
  watchStatsExtended:'#watch-info',
  watchThisVid:'#watch-this-vid',
  watchDescription:'#watch-description',
  headlineParent:'#watch-headline',
  Sidebar:'#watch-video-container'
};
function _onYouTubePlayerReady(){
  this.log('API ready..');
  $('#_loadingstuff').hide();
  $(document.body).addClass('ytnEnabled');
  player=(typeof unsafeWindow=='undefined'?window:unsafeWindow).document.getElementsByTagName('embed')[0];
  this.playVideo(this.current);
  this.awaitState(1,this.videoReady);
}

function initDOM($,conf){
  _self=youtube;
  $.extend(_self.config,conf);
  $.fn.extend({
    hasFocus: function (a) {
        return elem.hasFocus
    },
    reverse: function(){
      return this.pushStack(this.get().reverse(), arguments)
    },
    dispatch:function(type){
      var evt = document.createEvent("HTMLEvents");
      evt.initEvent(type, true, true );
      this[0].dispatchEvent(evt);
      return this;
    },
    getVideoID: function(){
      return $(this).is('a') &&
       _self.getNeedle('v',$(this).attr('href'));
    },
    activate: function(){
      var c='active been-there';
      if($(this).is('.video-thumb-90')){
        $('.video-list-item .video-thumb-90').removeClass('active');
        $(this).addClass(c);
      }else{
        $(this).siblings().removeClass('active').end().addClass(c);
      }
    }
  });
  var msg,videoID=_self.getNeedle('v',document.location);
  if(!videoID){
    msg="Apparently, you're not on a video page."+
    "<br/>How about clickin' on <a href='/watch?v=P6VUNnC3QdE'>this one</a>, huh?.....";
  }else{
    msg="Loading stuff.. hold on";
    if(/\/watch#!v/.test(document.location)){document.location='http://www.youtube.com/watch?v='+videoID;return;}
  }
   var st="position: absolute;position: fixed;width:99%; color: white;background-color:#8CC63F;"+  
          "font-size: 24pt; text-align: left;bottom:0;padding:10px 4px; z-index:999;";  
   $('<div>').attr('id','_loadingstuff').html(msg).attr('style',st).appendTo('body');  
  if(!videoID){return;}

  var css="http://means.googlecode.com/svn/trunk/youtube/less.cowbell.css";
var css="http://localhost/youtubian/less.cowbell.css";
  $('<link rel="stylesheet" type="text/css" href="'+css+'"/>').appendTo("head");

  $('<div class="humanized_msg"><p></p></div>').prependTo('body');
  $('#watch-other-vids >div:gt(1)').hide()
  $(classes.watchCommentPanel).wrap("<div id='newContent'>");
  $(classes.watchEmbedParent).before("<div id='rightSideContent'>");
  $(classes.watchDescription).remove().appendTo("#rightSideContent");
  $(classes.watchChannelVidsBody).remove().appendTo("#newContent");
  $(classes.watchRelatedDiscoverbox).remove().appendTo("#newContent");
  $(classes.watchChannelVidsBody).remove().appendTo("#newContent");
  $(classes.watchViewsStats).remove().prependTo(classes.watchStatsPanel);
  $(classes.watchStatsPanel).after($(classes.watchStatsExtended).remove());
  _self.user=$('#watch-description a.watch-description-username').eq(0).text();
  $(classes.watchRelatedDiscoverbox).after(
      '<div id="watch-result-discoverbox" class="watch-discoverbox">'+
      '<div class="_loadingInfo">....if you\'re reading this, it is a slow day at work..</div></div>');

    $("<div id='_loadingInfo'>Working on "+
      " <span class='related'>related videos</span>, "+
      " <span class='info'>description</span>, "+
      " <span class='comm'>comments</span>, and "+
      " <span class='user'>user channel</span>"+
     "</div>"+
     "<div class='tabs'>"+
       "<span>Order videos by: <a href='#'>views</a><a href='#'>duration</a></span>"+
       "<a href='#' name='related'>Related videos</a>"+
       "<a href='#' name='user'>More from user</a>"+
       "<a href='#' name='comments' title='View at own peril'>Comments <small></small></a>"+
       "<a href='#' name='results'>Results <small title='Results'></small></a>"+
     "</div>")
    .prependTo('#newContent');
   $("<a href='#'><span></span></a>").addClass('headcoll').click(function(){
      $("#masthead").slideToggle();
  }).prependTo("#masthead-container");
  $("<div id='srchOpt'><strong>Sort by:</strong><label><input type='radio' name='searchOrder' value='relevance' checked/>Relevance</label>"+
     "<label><input type='radio' name='searchOrder' value='published'/>Upload date</label>"+
     "<label><input type='radio' name='searchOrder' value='viewCount'/>View count</label>"+
     "<label><input type='radio' name='searchOrder' value='rating'/>Rating</label></div>").prependTo('#watch-headline-container');
  $('#rightSideContent').append(
        "<div><label><input type='checkbox' name='sticky'/><b>Sticky</b>: Keep current user and related videos!</label></div>"+
		"<div> Video: <b id='loadvidsize'>0 byes</b> of <span id='vidsize'>N/A</span> megabytes in cache</div>"+
        "<div> Deep link to this point of the video: <a id='deepLink' href='#'>link</a></div>"+
        "<table id='grabVideos'><caption><span></span>Download video<small>"+
        "in High quality and high definition</small></caption>"+
        "<tr><th colspan='3'>Flash video</th><th class='divider'/>"+
        "<th colspan='3'>MPEG-4</th><th class='divider'/><th colspan='2'>Mobile</th></tr>"+
        "<tr><td class='small flv'>LQ</td><td class='medium flv'>Normal</td><td class='large flv'>HQ</td>"+
        "<td class='divider'/><td class='medium mp4'>HQ</td><td class='hd720 mp4'>HD</td>"+
        "<td class='hd1080 mp4' title='Full HD (hd1080)'>FHD</td>"+
        "<td class='divider'/><td class='small _3gp'>3gp</td></tr></table>"

  ).add('#srchOpt').find('input').change(function(){
    _self.config[$(this).attr('name')]=$(this)[0].type=='radio'?$(this).val():$(this).attr('checked');
  });
  $('#rightSideContent>div,#srchOpt').addClass('ytSettings');
  $('#masthead').prepend('<p class="info">All links in this section work like regular ones, so be warned.</p>');
  $(classes.watchCommentPanel+' .video-list').remove();
  $(classes.watchRatingStats).find('.action-bar-ratings-stats').attr('title','').removeClass('yt-uix-tooltip');
  var hist=$('<a class="yhistory"><span/>Viewing history</a>').attr('title', 'Videos watched in this session').click(function(){$('.historyContainer').slideToggle();});
  $(classes.watchRatingStats).after(hist);
  _self.tab=classes.watchRelatedDiscoverbox;
  $("#grabVideos td:not(.divider)").each(function(){
    var c=$(this).attr('class').split(' '), s=c[0],f=c[1],o=_self.formats[f][s],fmt=o.fmt || '';
    $(this).addClass('yt-uix-tooltip').attr('title',o.name+'<br>Resolution:'+o.res)
    .click(function(){
      if(!fmt){_self.yell('Unknown format or video size');return;}
      if($.inArray(s, _self.available)<0){
        _self.yell('Sorry, video not available in that format.')
      }else{
        _self.yell('Requesting video, please hold..');
        _self.goPop('data:text/html;charset=utf-8;base64,PGgyPldhaXQgd2hpbGUgeW91ciBkb3dubG9hZCBiZWdpbnMuLjwvaDI+');
        _self.getVideoToken(fmt, _self.goPop);
      }
      return false;
    });
  });
  $('#masthead p.info').hide();
  $('#newContent .tabs > a[name=results]').hide();
  $(classes.watchEmbedParent).addClass('shadow');
  $('#newContent').addClass('related').find('.tabs > a').eq(0).addClass('active');
  $('#newContent .tabs span a:eq(0)').click(function(){
    _self.sortByViews();
    $(this).activate();
    return false;
  });    
  $('#newContent .tabs span a:eq(1)').click(function(){    
    _self.sortByDuration();
    $(this).activate();
    return false;
  });    
  $('#newContent .tabs > a').click(function(){
    var p=$(this).parent().parent();
    p.attr('class', $(this).attr('name'));
    _self.stopMiniVideo();
    $(this).activate();
    return false;
  });
  $(classes.watchViewsStats).click(function(){
    var c='yt-uix-expander-collapsed';
    $(this).toggleClass(c);
    if($(this).hasClass(c)){
      $(classes.watchStatsExtended).hide();
    }else{
     _self.getVideoStatsData();
    }
    return false;
  });
  $('#deepLink').attr('target','_blank');
  $('#_loadingInfo').before('<div class="historyContainer"><div/>'+
    '<a href="#" class="r"/><a href="#" class="l"/></div>');
  $('#newContent .yt-uix-pager button').live('click',function(e){
    var c='yt-uix-pager-selected',n=$(this).text(),id='#'+$(this).parent().parent()[0].id;
    if($(this).hasClass(c))return false;
    switch(id){
      case classes.watchChannelVidsBody:
      _self.getUserChannel(_self.user,n);
      break;
      case classes.watchRelatedDiscoverbox:
      _self.getRelatedVideos(_self.current,n);
      break;
      case classes.watchResultDiscoverbox:
      _self.getSearchVideos(_self.s,n);
      break;
    }
    _self.pagination[id]=n;
    $(this).siblings().removeClass(c).end().addClass(c+' loading');
  });
  $('.historyContainer div a').live('click',function(e){
    if(e.button!=0){return true;}
    var o=$(this).data('stuff');
    _self.current=o.i;
    _self.requestVideo(o.i,o.u);
    _self.setTitle(o.t);
    return false;
  });
  $('#eow-description-short').after($('<a><span class="m">more info</span><span class="l">less info</span></a>').click(function(){
    $('#watch-description').toggleClass('yt-uix-expander-collapsed');
    return false;
   })).html($('#eow-description').html());
  $('.watch-description-username').click(function(){
     $('html,body').animate({scrollTop: $('#newContent').offset().top},1000,
       function(){$('#newContent .tabs > a[name=user]').dispatch('click');}
     );
     return false;
  });
  $("<div id='onHoverPlayer'>").append('<div/><object type="application/x-shockwave-flash" data="/apiplayer?enablejsapi=1&amp;playerapiid=ytplayer"><param name="allowScriptAccess" value="always"><param name="wmode" value="transparent"></object>').appendTo('#newContent');
  $('#rightSideContent').prepend($('#masthead-search form.search-form').clone(true).attr('name','altSrch'));
  $('#rightSideContent .search-form .search-term').each(function() {
    var defValue = this.value="Results will appear below";this.id=this.name='';
    $(this).bind('focus blur',function(e) {
      $('#srchOpt').slideToggle();
      $(this).toggleClass("search-term-focus");
      if(e.type=='focus'){
        if(this.value == defValue)this.value = '';
      }else{
        if(this.value == '')this.value = defValue;
      }
    });
  });
  $('#rightSideContent .search-form').submit(function(){
    var s=$(this).find('input:eq(0)').val();
    if(s&&$.trim(s).length){
      _self.getSearchVideos(s);
      $('#_loadingInfo')[0].scrollIntoView();
      $('#newContent .tabs > a[name=results]').find('small').text('loading..').end().
         addClass('waiting').show().dispatch('click');
    }
    return false;
  }).click(function(e){
    if(e.target.tagName=='BUTTON')$(e.target).parent().dispatch('submit');
    return false;
  });

  _self.p=(typeof unsafeWindow=='undefined'?window:unsafeWindow).document.getElementById('onHoverPlayer').getElementsByTagName('object')[0];
  $('#newContent').mouseover(function(event){
    var t=event.target;
    if(t.tagName=='IMG' && $(t).parent().hasClass('img')){
      var a;_self.hovered=a=$(t).parents('a');
      if(typeof _self.p.mute!=='function') return false;
      _self.p.loadVideoById(_self.getNeedle('v',a.attr('href')));_self.p.unMute();
      $('#onHoverPlayer').css('top',$(t).offset().top).css('left',$(t).offset().left).css('visibility','visible');
      return false;
    }
  }).mouseout(function(event){
    var t=event.target,id=$(t).parent()[0].id;
    if(id=='onHoverPlayer' || t.className=='video-list-item'||t.className=='video-list-item-link'){
      _self.stopMiniVideo();return false;
    }
  }).mouseleave(function(event){_self.stopMiniVideo();});
  $('#onHoverPlayer div').click(function(e){_self.OnClick(_self.hovered,e);return false;});

  _self.addOnClick(classes.watchRelatedDiscoverbox);
  _self.addOnClick(classes.watchChannelVidsBody);
  _self.addOnClick(classes.watchResultDiscoverbox);
  _self.init(videoID);
};
  //
 // all systems go!
//
youtube.require(
 'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js',
 function(){
  youtube.require('http://means.googlecode.com/svn/trunk/youtube/jquery.tinysort.min.js');
  (function($){
    initDOM($,{
     sticky:false,
     maxSearch:50,
     maxChannel:50,
     maxRelated:40,
     searchOrder:'relevance'
    });
  })(jQuery);
});