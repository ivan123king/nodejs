var Chat = function(socket){
	this.socket = socket;
};
//发送消息方法
Chat.prototype.sendMessage = function(room,text){
	var message = {
		room:room,
		text:text
	};
	this.socket.emit('message',message);
};

//变更房间
Chat.prototype.changeRoom = function(room){
	this.socket.emit('join',{
		newRoom:room
	});
};

//处理命令
Chat.prototype.processCommand = function(command){
	var words = command.split(' ');
	var command = words[0].substring(1,words[0].length).toLowerCase();
	var message = false;
	
	switch(command){
		case 'join'://加入房间
			words.shift();
			var room = words.join(' ');
			this.changeRoom(room);
			break;
		case 'nick'://更名
			words.shift();
			var name = words.join(' ');
			this.socket.emit('nameAttempt',name);
			break;
		default:
			message = "Unrecognized command";
			break;
	}
	return message;
}