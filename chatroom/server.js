var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');

var readline = require('readline');

var cache = {}; //用来缓存文件内容对象

//404错误响应
function send404(response){
	response.writeHead(404,{'Content-Type':'text/plain'});
	response.write('Error 404 : resource not fount');
	response.end();
}

//发送文件内容
function sendFile(response,filePath,fileContents){
	response.writeHead(200,{'content-type':mime.lookup(path.basename(filePath))});
	response.end(fileContents);
}

//前两个方法的逻辑判断
function serverStatic(response,cache,absPath){
	if(cache[absPath]){//检查文件是否存在内存中
		sendFile(response,absPath,cache[absPath]);//从内存中返回文件
	}else{
		fs.exists(absPath,function(exists){//检查文件是否存在
			if(exists){
				fs.readFile(absPath,function(err,data){//从硬盘读取文件
					if(err){
						send404(response);//读取文件错误，返回404，文件不存在
					}else{
						//文件存在，放入内存，发送文件内容
						cache[absPath] = data;
						sendFile(response,absPath,data);
					}
				});
			}else{
				send404(response);//文件不存在，返回404错误
			}
		});
	}
}

var server = http.createServer();

//获取url请求客户端ip
var get_client_ip = function(req) {
    var ip = req.headers['x-forwarded-for'] ||
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress || '';
    if(ip.split(',').length>0){
        ip = ip.split(',')[0]
    }
    return ip;
};

var whiteIP = [];

var readIs = readline.createInterface({
	input:fs.createReadStream("./whiteip.txt")
});

var initWhiteIP = function(){
	readIs.on("line",(line)=>{
		whiteIP.push(line);
	});
}

var checkIP = function(){
	
	var inIP = false;
	for(var index in whiteIP){
		//console.log(whiteIP[index]);
		if(get_client_ip(request)==whiteIP[index]){
			inIP = true
			break;
		}
	}
	if(!inIP){	
		response.end("welcome");
		return;
	} 
}

server.on('request',function(request,response){
	
	
	console.log(get_client_ip(request));
	
	var filePath = false;
	if(request.url =='/'){
		filePath = 'public/index.html';
	}else{
		filePath = 'public'+request.url;
	}
	var absPath = './'+filePath;
	serverStatic(response,cache,absPath);
});
server.listen(4000,function(){
	//initWhiteIP();
	console.log('Server listenning on port 4000.');
});

var chatServer = require('./lib/chat_server');
chatServer.listen(server);


















