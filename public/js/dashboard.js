var socket = io(document.location.origin);

$('.sideButton').click(function(){
  var classList = this.className.split(/\s+/);
  $('.tohide').hide();
  $('#'+classList[2]).fadeIn(200);
  return false;
});

$('#remUp').submit(function(){
  var remUpLink = $("#rlink").val();
  var fileName = $("#rname").val();
  socket.emit("remoteUpload",{
    link:remUpLink,
    fileName:fileName
  });
  $("#remUp").trigger('reset');
  return false;
});

//Connect Event
socket.on('connect',function(data){
  Materialize.toast("Connected to Server",1000);
});

//Disconnect Event
socket.on('disconnect',function(data){
  Materialize.toast("Disconnected From Server",5000);
});

//Exception Handler
socket.on('Exception',function(data){
  Materialize.toast(data.error,5000);
});

//Basic Status Messages
socket.on('Status',function(data){
  Materialize.toast(data.message,1500);
});

//All files
socket.on('allFiles',function(files){
  files.forEach(function(file){
    var xHtml = '<p href="/downloadedFile?name='+file+'" id="p'+file+'" class="collection-item" style="height:3.6em;line-height:2.5em;text-align:right;"><span style="float:left">'+file+'</span> <button class="waves-effect btn tooltipped cButton" id="c'+file+'" style="display:inline-block;" data-position="top" data-delay="50" data-tooltip="Copy to clipboard" >Copy</button> <button class="btn waves-effect tooltipped dButton" id="d'+file+'" style="background-color:#e57373;display:inline-block;" data-position="top" data-delay="50" data-tooltip="Delete the file">Delete</button> </p>'
    $('#filesCollection').append(xHtml);
  });
});

//New File is added
socket.on('newFile',function(file){
  var xHtml = '<p href="/downloadedFile?name='+file+'" id="p'+file+'" class="collection-item" style="height:3.6em;line-height:2.5em;text-align:right;"><span style="float:left">'+file+'</span> <button class="waves-effect btn tooltipped cButton" id="c'+file+'" style="display:inline-block;" data-position="top" data-delay="50" data-tooltip="Copy to clipboard" >Copy</button> <button class="btn waves-effect tooltipped dButton" id="d'+file+'" style="background-color:#e57373;display:inline-block;" data-position="top" data-delay="50" data-tooltip="Delete the file">Delete</button> </p>'
  $('#filesCollection').append(xHtml);
});

//All downloading
socket.on("allDownloading",function(downloading){
  jQuery.each(downloading,function(i,val){
    var xHtml = '<li id="li'+val.name+'"> <div class="collapsible-header active"><i class="material-icons">import_export</i>'+val.name+'</div><div class="collapsible-body"> <div class="progress"> <div class="determinate" id="progress'+val.name+'" style="width: '+val.progress+'"></div></div><h6 id="text'+val.name+'" style="position:relative;left:42%;top:10px">'+val.progress+'</h6> </div></li>'
    $('#statusList').append(xHtml);
  })
});

//new Downloading
socket.on("newDownloading",function(val){
  var xHtml = '<li id="li'+val.name+'"> <div class="collapsible-header active"><i class="material-icons">import_export</i>'+val.name+'</div><div class="collapsible-body"> <div class="progress"> <div class="determinate" id="progress'+val.name+'" style="width: '+val.progress+'"></div></div><h6 id="text'+val.name+'" style="position:relative;left:42%;top:10px">'+val.progress+'</h6> </div></li>'
  $('#statusList').append(xHtml);
  Materialize.toast(val.name+" Download started",700,'rounded');
});

//Downloading done
socket.on("downloadingDone",function(name){
  Materialize.toast(name+" Download finished",700,'rounded');
  var id = "li"+name.split('.').join('\\.');
  $('#'+id).remove();
})

//Progress Download
socket.on("downloadingProgress",function(downloading){
  jQuery.each(downloading,function(i,val){
    try{
      var pid = 'progress'+(val.name.split('.').join('\\.'));
      var tid = 'text'+(val.name.split('.').join('\\.'));
      $('#'+pid).css('width',val.progress);
      $('#'+tid).text(val.progress);
    }catch(e){
      console.log(e)
    }
  })
});

//All torrents
socket.on('allTorrents',function(torrents){
  torrents = torrents.torrents;
  torrents.forEach(function(torrent){
    var xHtml = '<li id="t'+torrent.name+'"> <div class="collapsible-header active"><i class="material-icons">swap_vert</i>'+torrent.name+'</div><div class="collapsible-body"> <div class="progress"> <div id="prt'+torrent.name+'" class="determinate" style="width: '+torrent.progress.toFixed(0)+'%"></div></div><h6 id="h6t'+torrent.name+'" style="position:relative;left:24%;top:10px">Download Speed:'+(torrent.speed/(1024*1024)).toFixed(2)+'MBps | Total Downloaded:'+(torrent.downloaded/(1024*1024)).toFixed(2)+'MB | Download Size: '+(torrent.size/(1024*1024)).toFixed(2)+'MB | ETA: '+(torrent.eta/1000).toFixed(2)+' secs  </h6> </div></li>';
    $('#torrentList').append(xHtml);
  });
})

//New Torrent
socket.on("newTorrent",function(torrent){
  var xHtml = '<li id="t'+torrent.name+'"> <div class="collapsible-header active"><i class="material-icons">swap_vert</i>'+torrent.name+'</div><div class="collapsible-body"> <div class="progress"> <div id="prt'+torrent.name+'" class="determinate" style="width: '+torrent.progress+'%"></div></div><h6 id="h6t'+torrent.name+'" style="position:relative;left:24%;top:10px">Download Speed:'+(torrent.speed/(1024*1024)).toFixed(2)+'MBps | Total Downloaded:'+(torrent.downloaded/(1024*1024)).toFixed(2)+'MB | Download Size: '+(torrent.size/(1024*1024)).toFixed(2)+'MB | ETA: '+(torrent.eta/1000).toFixed(2)+' secs  </h6> </div></li>';
  console.log("************")
  console.log(xHtml)
  $('#torrentList').append(xHtml);
});

//Torrent Progress
socket.on("progressTorrents",function(torrents){
  torrents = torrents.torrents;
  torrents.forEach(function(torrent){
    console.log(torrent);
    var pid = 'prt'+(torrent.name.split('.').join('\\.'));
    var tid = 'h6t'+(torrent.name.split('.').join('\\.'));
    $('#'+pid).css('width',torrent.progress);
    var prog = 'Download Speed:'+(torrent.speed/(1024*1024)).toFixed(2)+'MBps | Total Downloaded:'+(torrent.downloaded/(1024*1024)).toFixed(2)+'MB | Download Size: '+(torrent.size/(1024*1024)).toFixed(2)+'MB | ETA: '+(torrent.eta/1000).toFixed(2)+' secs  ';
    $('#'+tid).text(prog);
  })
});

//Remove Torrent
socket.on('remTorr',function(torrent){
  var pid = 't'+(torrent.split('.').join('\\.'));
  $('#'+pid).remove();
})

function copyToClipboard(text) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(text).select();
    document.execCommand("copy");
    $temp.remove();
}

$(document).on('click','.cButton',function(e){
  var file = this.id.substr(1);
  copyToClipboard(document.location.origin+"/downloadedFile?name="+file);
  Materialize.toast('Copied to Clipboard', 1000, 'rounded');
  return false;
});

$(document).on('click','.dButton',function(e){
  var file = this.id.substr(1);
  socket.emit("deleteFile",{
    fileName:file
  });
  var pid = 'p'+(file.split('.').join('\\.'));
  $('#'+pid).remove();
  Materialize.toast("Deleting "+file, 700, 'rounded');
  return false;
});

$('#addTorr').submit(function(e){
  var mlink = $('#mlink').val();
  var mfolder = $('#mname').val();
  socket.emit('addTorrent',{
    magnet:mlink,
    name:mfolder
  });
  $('#mlink').val('');
  $('#mname').val('');
  return false;
});

$('#clientAdd').submit(function(e){
  var link = $('#clink').val();
  var numParts = $('#cnumparts').val();
  var filename = $('#cname').val();
  socket.emit('startDownload',{
    link:link,
    numParts:numParts,
    filename:filename
  });
  Materialize.toast('Sending data to Client...',1000);
  return false;
});


$(document).ready(function(){
  $('.tohide').hide();
  socket.emit('allFiles');
  socket.emit('allDownloading');
  socket.emit('allTorrents');
  $('#remoteUpload').show();
  setInterval(function () {
    socket.emit('downloadingProgress');
    socket.emit('progressTorrents');
  }, 1000);
})
