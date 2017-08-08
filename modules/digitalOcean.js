var request = require('request');

var base_link = "https://api.digitalocean.com"

exports.createVolume = function createVolume(config,callback){
  if(!config.size || config.size>50){
    return callback({
      error:'Invalid Size'
    },null);
  }
  if(!config.key){
    return callback({error:"No Key Provided"},null);
  }
  var options = {
    method:'POST',
    url:base_link+"/v2/volumes",
    headers:{
      'Authorization':' Bearer '+config.key,
      'Content-Type': 'application/json'
    },
    body:{
      size_gigabytes:config.size,
      name:config.name || 'default',
      region:config.region || 'nyc1'
    }
  }
  request(options,function(error,response,body){
    callback(error,body);
  });
}

exports.deleteVolume = function deleteVolume(config,callback){
  if(!config._id){
    return callback({error:'Invalid ID'},null);
  }
  if(!config.key){
    return callback({error:"No Key Provided"},null);
  }
  var options = {
    method:'DELETE',
    headers:{
      "Content-Type":"application/json",
      "Authorization":" Bearer "+config.key
    },
    url:base_link+"/v2/volumes/"+config._id
  }
  request(options,callback);
}

exports.attachVolume = function attachVolume(config,callback){
  if(!config.volume){
    return callback({error:'Invalid Volume Id'},null);
  }
  if(!config.droplet){
    return callback({error:'Invalid droplet Id'},null);
  }
  if(!config.key){
    return callback({error:"No Key Provided"},null);
  }
  var options = {
    method:'POST',
    headers:{
      "Content-Type":"application/json",
      "Authorization":" Bearer "+config.key
    },
    body:{
      type:'attach',
      droplet_id:config.droplet,
      region:config.region || 'nyc1'
    }
  }
  request(options,function(error,response,body){
    callback(error,body);
  });
}

exports.detachVolume = function detachVolume(config,callback){
  if(!config.volume){
    return callback({error:'Invalid Volume Id'},null);
  }
  if(!config.droplet){
    return callback({error:'Invalid droplet Id'},null);
  }
  if(!config.key){
    return callback({error:"No Key Provided"},null);
  }
  var options = {
    method:'POST',
    headers:{
      "Content-Type":"application/json",
      "Authorization":" Bearer "+config.key
    },
    body:{
      type:'detach',
      droplet_id:config.droplet,
      region:config.region || 'nyc1'
    }
  }
  request(options,function(error,response,body){
    callback(error,body);
  });
}
