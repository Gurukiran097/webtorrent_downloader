var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var mmm = require('mmmagic');
var Magic = mmm.Magic;
var magic = new Magic(mmm.MAGIC_MIME_TYPE);


/* GET home page. */

router.get('/downloadedFile',(req,res)=>{
	if(!req.query || !req.query.name){
		return res.status(400).end("Invalid Query Parameter");
	}
	let fileName = req.query.name;
	let link = path.join(__dirname,"../downloads/"+fileName);
    fs.stat(link,function(err,stats){
      if(err){
        return res.status(422).json({errors:{detail:'Cant find file'}});
      }
      magic.detectFile(link,function(err,mime){
	if(err) {
		throw err;
		return;
	}
      var range = req.headers.range;
      var total = stats.size;
      if(!range){
      	range = "bytes=0-"
        // res.status(416).end('Wrong Range');
      }
      var positions = range.replace(/bytes=/,'').split('-');
      var start = parseInt(positions[0], 10);
      var end = positions[1] ? parseInt(positions[1],10):total-1;
      var chunksize = (end-start)+1;	
      /*var length = results.resultsuri[1].split['.'].length;
      var type = results.resultsuri[1].split['.'][length-1];*/
      res.writeHead(206,{
        "Content-Range": "bytes " + start + "-" + end + "/" + total,
        "Accept-Ranges": "bytes",
	"Content-Type": mime,
        "Content-Length": chunksize,
	"Content-Disposition": "attachment; filename=\"" + fileName +"\"",
        // "Content-Type": result.contenttype
      });
      var stream = fs.createReadStream(link,{start:start,end:end})
      .on('open',function(){
        stream.pipe(res);
      });
      stream.on('error',function(err){
        console.log(err);
      });
      });
    });
});

router.use(function(req, res, next) {
  if (req.session && req.session.user) {
    if(req.session.user==='admin'){
      console.log("Admin Logged In")
      next();
    }else{
      res.redirect('/auth')
    }
  } else {
    res.redirect('/auth')
  }
});

router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname,"../views/index.html"));
});

router.get('/dashboard',(req,res)=>{
  res.sendFile(path.join(__dirname,'../views/dashboard.html'));
})

// router.get('/fileSize',(req,res)=>{
// 	if(!req.query || !req.query.name){
// 		return res.status(400).end("Invalid Query Parameter");
// 	}
// 	let link = path.join(__dirname,"../downloads/"+fileName);
// 	fs.stat(link,function(err,stats){
// 		if(err){
// 			return res.status(422).json({errors:{detail:'Cant find file'}});
// 		}
// 		res.status(200).json({size:stats.size})
// 	});
// });

module.exports = router;
