var express = require('express');
var router = express.Router();
var path = require('path');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname,'../views/login.html'));
});

router.post('/',function(req,res){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({error:"Invalid Username and Password"});
  }
  if(req.body.username==="admin"){
    if(req.body.password==="darthvader"){
      req.session.user = "admin";
      return res.status(200).json({data:"Success"});
    }else {
      return res.status(401).json({error:"Invalid Username and Password"});
    }
  }else{
    return res.status(401).json({error:"Invalid Username and Password"});
  }
});

router.get('/logout',function(req,res){
  req.session.reset();
  res.redirect('/auth');
})

module.exports = router;
