var path = require("path");
var server = require(path.join(__dirname,"./bin/www"));
var io = require("socket.io")(server);
var fs = require('fs');
var mkdirp = require('mkdirp');
var request = require('request');
var webtorrent = require('webtorrent');
var util = require('util');
var spawn = require('child_process').spawn;
var archiver = require('archiver');
var rimraf = require('rimraf');

var clients = [];
var length = 0;
var client_downloading = {};
var downloading = {};
var torrentIdTracker = {}
var client = new webtorrent();
//TORRENT EVENTS

client.on('torrent',function(torrent){
  torrent.on('ready',function(){
    console.log("Torrent Ready")
  });

  torrent.on('done',function(){
    var output = fs.createWriteStream(path.join(__dirname,'./downloads/'+torrentIdTracker[torrent.infoHash]+'.zip'));
    var archive = archiver('zip', {
      store: true
    });
    console.log('Torrent Completed Now Zipping');
    archive.pipe(output);
    archive.directory(path.join(__dirname,'./torrents/'+torrentIdTracker[torrent.infoHash]),torrentIdTracker[torrent.infoHash]);
    archive.finalize();
    output.on('close',function(){
      rimraf(path.join(__dirname,'./torrents/'+torrentIdTracker[torrent.infoHash]),function(){
        io.sockets.emit('Status',{
          message:torrentIdTracker[torrent.infoHash]+" Torrent Complete"
        });
        io.sockets.emit('newFile',torrentIdTracker[torrent.infoHash]+'.zip');
        io.sockets.emit('remTorr',torrentIdTracker[torrent.infoHash]);
        torrent.destroy();
      })
    })
  });
})

io.on('connection',function(socket){
  console.log(socket.id+" connected");
  socket.emit("clientCheck");

  socket.on("statusDownload",function(data){
    if(data.success===-1){
      console.log("Download Failed");
      io.to(client_downloading[socket.id].user).emit("Exception",{
        error:"Download Failed"
      });
    }else{
      console.log("Download Success");
      io.to(client_downloading[socket.id].user).emit("downloadOver",true);
    }
  });

  socket.on("startedDownload",function(data){
    if(data==="Success"){
      client_downloading[socket.id].status = true;
      io.to(client_downloading[socket.id].user).emit("startedDownload",true);
    }else{
      client_downloading[socket.id].status = false;
      io.to(client_downloading[socket.id].user).emit("startedDownload",false);
    }
  })

  socket.on("clientCheck",function(data){
    if(data==="True"){
      client_downloading[socket.id] = {};
      clients.push(socket.id);
      client_downloading[socket.id].status = false;
      length++;
    }
  });

  socket.on("remoteUpload",function(data){
    let link = data.link;
    let fileName = data.fileName;
    if(!link || !fileName){
      return socket.emit('Exception',{
        error:"Link and Filename required"
      })
    }
    mkdirp(path.join(__dirname,"./temp/"),function(err){
      if(err){
        console.log(err);
        return socket.emit("Exception",{
          error:"Folder Create Error"
        });
      }
      let options = {
        directory:path.join(__dirname,"./temp/"),
        filename:fileName,
        timeout:20000000
      }
      socket.emit("Status",{
          message:"Download Starting..."
      });
      let req = request({
        method:'GET',
        uri:link
      });
      let pathD = path.join(__dirname,"./temp/"+fileName);
      fs.exists(pathD,function(exists){
        if(exists){
          return socket.emit('Exception',{
            error:fileName+" Already Exists"
          });
        }else{
          fs.exists(path.join(__dirname,"./downloads/"+fileName),function(rexists){
            if(rexists){
              return socket.emit('Exception',{
                error:fileName+" Already Exists"
              });
            }else{
              let fos = fs.createWriteStream(pathD);
              let remaining = 0;
              let contentLength = 0
              downloading[fileName] = {
                link:link,
                progress:"0%",
                done:false,
                error:false,
                name:fileName
              }
              req.on('response',function(data){
                contentLength+=data.headers['content-length'];
                remaining+=data.headers['content-length'];
                io.sockets.emit('newDownloading',downloading[fileName])
              });

              req.on('error',function(err){
                console.log(err);
                socket.emit('Exception',{
                  error:'Error While Downloading'
                });
                downloading[fileName].error = true;
              });

              req.on('data',function(chunk){
                remaining-=chunk.length;
                downloading[fileName].progress = (((contentLength-remaining)/contentLength)*100).toFixed(1)+"%";
                if(!remaining){
                  delete downloading[fileName];
                }
                // console.log((((contentLength-remaining)/contentLength)*100).toFixed(1)+"%");
              });

              req.on('end',function(){
                // downloading[fileName].done = true;
                fs.rename(pathD,path.join(__dirname,'./downloads/'+fileName),function(){
                  io.sockets.emit('newFile',fileName);
                  io.sockets.emit('downloadingDone',fileName);
                });
//                 let fis = fs.createReadStream(pathD);
//                 let ws = fs.createWriteStream(path.join(__dirname,'./downloads/'+fileName));
//                 fis.pipe(ws);
//                 fis.on('end',function(){
//                   fs.unlink(pathD);
//                   io.sockets.emit('newFile',fileName);
//                   io.sockets.emit('downloadingDone',fileName);
//                 });
              });
              req.pipe(fos);
            }
          })
        }
      })
    });
  });

  socket.on('allFiles',function(){
    let pathF = path.join(__dirname,"./downloads/");
    fs.readdir(pathF,(err,files)=>{
      if(err){
        console.log(err);
        return socket.emit('Exception',{
          error:'Error Reading Download Directory'
        });
      }
      socket.emit('allFiles',files);
    })
  });

  socket.on("deleteFile",(data)=>{
    fs.exists(path.join(__dirname,'./downloads/'+data.fileName),(exists)=>{
      if(exists){
        fs.unlink(path.join(__dirname,'./downloads/'+data.fileName));
        socket.emit("Status",{
          message:"Delete Successful",
        })
      }else{
        socket.emit("Exception",{
          error:"File Not Found"
        });
      }
    });
  });

  socket.on("startDownload",function(data){
    var link = data.link;
    var numParts = data.numParts;
    var filename = data.filename
    var flag = 0;
    for(let i=0;i<length;i++){
      if(!client_downloading[clients[i]].status){
        flag=1;
        io.to(clients[i]).emit("startDownload",{
          link:link,
          numParts:numParts,
          filename:filename
        });
        client_downloading[clients[i]].user = socket.id;
        break;
      }
    }
    if(!flag){
      socket.emit("Exception",{
      error:"No Clients"
    })
    }
  });

  socket.on("allDownloading",function(data){
    socket.emit('allDownloading',downloading);
  });

  socket.on("downloadingProgress",function(){
    socket.emit("downloadingProgress",downloading);
  });

  //TORRENT START
  socket.on("addTorrent",function(data){
    if(!data.magnet || !data.name){
      return socket.emit('Exception',{
        error:"Insufficient Parameters"
      });
    }
    client.add(data.magnet,{path:path.join(__dirname,'./torrents/'+data.name+"/")},function(torrent){
      torrentIdTracker[torrent.infoHash] = data.name;
      console.log("Torrent Added");
      io.sockets.emit('Status',{
        message:data.name+" Torrent Added"
      });
      console.log('Sending newTorrent')
      io.sockets.emit('newTorrent',{
        name:data.name,
        downloaded:torrent.downloaded,
        eta:torrent.timeRemaining,
        speed:torrent.downloadSpeed,
        size:torrent.length,
        progress:(torrent.progress*100).toFixed(1)+"%"
      });
    });
  });

  socket.on("allTorrents",function(){
    let torrents = [];
    client.torrents.forEach(function(torrent,i){
      let torrObj = {
        name:torrentIdTracker[torrent.infoHash],
        downloaded:torrent.downloaded,
        eta:torrent.timeRemaining,
        speed:torrent.downloadSpeed,
        size:torrent.length,
        progress:(torrent.progress*100).toFixed(1)+"%"
      }
      torrents.push(torrObj);
    });
    socket.emit('allTorrents',{
      torrents:torrents
    });
  });

  socket.on("progressTorrents",function(){
    let torrents = [];
    client.torrents.forEach(function(torrent,i){
      let torrObj = {
        name:torrentIdTracker[torrent.infoHash] || "Unknown",
        downloaded:torrent.downloaded,
        eta:torrent.timeRemaining,
        speed:torrent.downloadSpeed,
        size:torrent.length,
        progress:(torrent.progress*100).toFixed(1)+"%"
      }
      torrents.push(torrObj);
    });
    socket.emit('progressTorrents',{
      torrents:torrents
    });
  });
  //TORRENT END

  socket.on("clearTemp",function(){
    let basePath = path.join(__dirname,'./temp')
    fs.readdir(basePath,function(err,files){
      if(err){
        console.log(err);
        return socket.emit("Exception",{
          error:"Clear Temp Failed"
        });
      }
      files.forEach(function(file){
        fs.unlink(basePath+"/"+file);
      });
    })
  });

  socket.on('disconnect',function(){
    console.log(socket.id+" disconnected");
  })
});
