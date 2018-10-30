var socketio = require('socket.io');

var fs = require('fs');

var io;
var guestNum = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};




exports.listen = function(server){
	io = socketio.listen(server);
	io.set('log level',1);
	io.sockets.on('connection',function(socket){
		
		//在用户连接上时，赋予其一个访客名
		guestNum = assignGuestName(socket,guestNum,nickNames,namesUsed);
		//临时加入一个聊天室
		joinRoom(socket,'Lobby');
		//广播消息
		handleMessageBroadcasting(socket,nickNames);
		//更改名字
		handleNameChangeAttempts(socket,nickNames,namesUsed);
		//创建或变更聊天室
		handleRoomJoining(socket);
		
		socket.on('rooms',function(){
			socket.emit('rooms',io.sockets.manager.rooms);
		});
		
		//用户断开连接处理
		handleClientDisconnection(socket,nickNames,namesUsed);
	});
}




//分配用户昵称
function assignGuestName(socket,guestNumber,nickNames,namesUsed){
	var name = 'Guest'+guestNumber;
	nickNames[socket.id] = name;
	//发送消息通知其他用户新用户昵称
	socket.emit('nameResult',{
		success:true,
		name:name
	});
	namesUsed.push(name);
	return guestNumber+1;
}

//加入聊天室
function joinRoom(socket,room){
	socket.join(room);
	currentRoom[socket.id] = room;//记录用户当前房间
	socket.emit('joinResult',{room:room});
	//广播告知其他用户有新用户加入
	socket.broadcast.to(room).emit('message',{
		text:nickNames[socket.id]+' has joined '+ room+'.'
	});
	//获取房间里用户列表
	var usersInRoom = io.sockets.clients(room);
	if(usersInRoom.length>1){
		var usersInRoomSummary = 'Users currently in '+room + ':';
		for(var index in usersInRoom){
			var userSocketId = usersInRoom[index].id;
			if(userSocketId!=socket.id){
				if(index>0){
					usersInRoomSummary += ',';
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
		usersInRoomSummary += ".";
		//将房间里其他用户的汇总发送给这个用户
		socket.emit('message',{text:usersInRoomSummary});
	}
}

//更名请求
function handleNameChangeAttempts(socket,nickNames,namesUsed){
	socket.on('nameAttempt',function(name){
		if(name.indexOf('Guest')==0){//昵称不能以Guest开头
			socket.emit('nameResult',{
				success:false,
				message:'Names cannot begin with "Guest". '
			});
		}else{
			//新昵称尚未被使用
			if(namesUsed.indexOf(name)==-1){
				//获取先前的用户昵称
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;
				//删除用户先前的昵称
				delete namesUsed[previousNameIndex];
				//通知用户新昵称
				socket.emit('nameResult',{
					success:true,
					name:name
				});
				//通知聊天室其他人用户修改的新昵称
				socket.broadcast.to(currentRoom[socket.id]).emit('message',{
					text:previousName+' is now known as '+name + '.'
				});
			}else{
				//告知用户此昵称已被使用
				socket.emit('nameResult',{
					success:false,
					message:'That name is already in use.'
				});
			}
		}
	});
}

//发送消息
function handleMessageBroadcasting(socket){
	socket.on('message',function(message){
		socket.broadcast.to(message.room).emit('message',{
			text:nickNames[socket.id]+':'+message.text
		});
	});
}

//创建房间
function handleRoomJoining(socket){
	socket.on('join',function(room){
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket,room.newRoom);
	});
}

//用户离开处理
function handleClientDisconnection(socket){
	socket.on('disconnect',function(){
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}



