var player;
var youtube={
  require: function (src, callback) {
    var c = document.createElement("script");
    c.src = src;
    c.type = "text/javascript";
    if (callback) {
      c.onload = callback;
    }
    document.getElementsByTagName("head")[0].appendChild(c);
  },
  getNeedle:function (needle, hayStack){
    var regex= new RegExp("\\b"+needle+"=([^&$)]*)",'ig');
    var m=regex.exec(unescape(hayStack));
    return m && m[1];
  },
  getFlashVar:function(name){
    var o=jQuery("#watch-player-div embed").attr('flashvars');
    return this.getNeedle(name, o);
  },
  getDownloadURL:function (vId, t, format) {
    //http://www.youtubemp4.com/video/vcE8xJkK6t4.mp4
    return  "/get_video?video_id=" + vId + "&t=" + t + ((format == "") ? "" : "&fmt=" + format);
  },
  playVideo:function(id, from, quality) {
    player.cueVideoById(id);
    player.playVideo();
    //player.loadVideoById(id);
  },
  setHD:function() {
    player.setPlaybackQuality('hd720');
  },
  getSize:function(){
    return player.getVideoBytesTotal();
  },
  getBytesLoaded:function(){
    return player.getVideoBytesLoaded();
  },
  initplayer:function(currentVideoID) {
    var o=jQuery("#watch-player-div embed");
    player=o.get(0);
    console.log('init:'+currentVideoID)
        o.attr('flashvars','').attr('src','http://www.youtube.com/v/'+currentVideoID+'?enablejsapi=1&hl=en_GB&fs=1&autoplay=1')
  },
  sortByDuration:function(){
    jQuery(".video-entry").tsort(".video-time",{order:"desc",attr:"duration"});
  },
  sortByViews:function(){
    jQuery(".video-entry").tsort(".video-view-count",{order:"desc",attr:"views"});
  },
  onPlayerError:function(code){
    alert("Gahh! an error occured: " + code);
  },
  init:function(){
    this.initplayer(this.getNeedle('v',document.location));
  }
}
//callback when player is ready
onYouTubePlayerReady=function(playerId) {
  player.addEventListener("onError", "onPlayerError"); 
  //setHD();
}

youtube.require(
  'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js',
  function(){
    this.require('http://code.google.com/p/means/source/browse/trunk/youtube/jquery.tinysort.min.js');    
    (function($){
      $.fn.extend({
        hasFocus: function (a) {
            return elem.hasFocus
        },
        getVideoID: function(){
          return $(this).is('a') &&
           youtube.getNeedle('v',$(this).attr('href'));
        },
        activate: function(){
          $(this).siblings().removeClass('active').end().addClass('active');
        },
        reverse: function(){
          return this.pushStack(this.get().reverse(), arguments)
        }
      });

      $('<link rel="stylesheet" id="youtubeCSS"  href="http://code.google.com/p/means/source/browse/trunk/youtube/less.cowbell.css"/>').appendTo("head");
    //getDownloadURL('Fad6eZTDikA', getFlashVar('t'),'18')

      $('#watch-other-vids >div:gt(1)').hide()
      $('#watch-comment-panel').wrap("<div id='newContent'>");
      $("#watch-related-discoverbox").remove().appendTo("#newContent");
      $("#watch-channel-discoverbox").remove().appendTo("#newContent");
      $('#watch-ratings-views').remove().appendTo('#watch-other-vids');

      $("<div class='tabs'>"+
           "<span>Order videos by<br><a href='#'>views</a><a href='#'>duration</a></span>"+
           "<a href='#' name='related'>Related videos</a>"+
           "<a href='#' name='user'>More from user</a>"+
           "<a href='#' name='comments' title='View at own peril'>Comments</a>"+
         "</div>")
        .prependTo('#newContent');
      $("<a href='#'></a>").addClass('headcoll').click(function(){
          $("#masthead").slideToggle();
      }).prependTo("#masthead-container");
      $('#watch-ratings-views').after("<span> Link to this point of the video: <a id='pointLink' href='#'></a>");
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
        return false;
      });
      $('.video-entry > a,.video-entry .video-mini-title a').click(function(){
        var id=$(this).getVideoID();
        console.log(id);      
        youtube.playVideo(id);
        return false;
      });
      $('.video-entry .video-view-count').each(function(){
        var views=$(this).text().split(' ')[0].replace(',','');
        $(this).attr('views',views);
      });
      $('.video-entry .video-time').each(function(){
        var a=$(this).find('span').text().split(':');
        var duration=a.length>2?1*a[0]*60*60+1*a[1]*60+1*a[2]:1*a[0]*60+1*a[1];
        $(this).attr('duration',duration);
      });
      
      youtube.init();
      
      //<span>Sort by<br><a href="#">views</a><a href="#">duration</a></span>
      
      //yt.www.watch.player.enableWideScreen(!_hasclass(_gel('baseDiv'), 'watch-wide-mode'), true);
  })(jQuery);
});
           
