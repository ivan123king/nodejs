var redis = require('redis');
var client = redis.createClient(10014,'10.25.0.253');
//添加密码认证
client.auth('huawei',function(err){
	
});
client.on('error',function(err){
	console.log('Error'+err);
});

function photo(name,path){
	this.name = name;
	this.path = path;
}

var photosName = "photosName";


module.exports.create = function(name,path){
	//设置hash表元素
	client.hmset("{photo}:"+name,{
		name:name,
		path:path
	},redis.print);

	client.sadd(photosName,name);
}

module.exports.remove = function(name,path){
	//获取hash表的键
	client.hdel("{photo}:"+name,{
		name:name,
		path:path
	});
	client.srem(photosName,name);
}

module.exports.update = function(name,path){
	//设置hash表元素
	client.hset("{photo}:"+name,{
		name:name,
		path:path
	},redis.print);
}

module.exports.find = find;

function find(name){
	//获取hash表中cooking元素
	
}

/*
注意此处的redis操作是一个异步过程，使用回调函数返回数据
目前没有找到任何同步操作，
使用循环，设置超时时间作为同步
*/
module.exports.findAll = function(){
	var photosRet = [];

	// var startTime = Date.now();
	
	client.smembers(photosName,function(err,names){
		for(var index in names){
			var name = names[index];
			client.hget("{photo}:"+name,'path',function(err,path){
				if(err) throw err;
				var photo = {name:name,path:path};
				photosRet.push(photo);;
			});
		}
	});

	return photosRet;
}