var multer  = require('multer');
var Photo = require('../models/Photo');
var path = require('path');
var fs = require('fs');
var os = require('os');

//npm install readline --save
var readline = require('readline');

var utils = require('../utils/utils');


var photos = [];

var express = require('express');
var router = express.Router();
var uploadPath = multer({dest: __dirname+'/public/photos'});


var listFilePath = __dirname+"/public/photos/list.txt";

/* 展示图片的方法 */
router.get('/', function(req, res, next) {

	if(photos.length==0)
		readListFile();

	utils.print(photos);

	res.render('photos',{//寻找views目录下photos目录对应index.ejs
		title:'Photos',
		photos:photos
	});
});

function readListFile(){
	//图片列表文件读取
	var data = fs.readFileSync(listFilePath,{encoding:'utf8',flag:'r'});
	if(data){
		utils.print(data);
		var photoInfos = data.split(os.EOL);
		if(photoInfos&&photoInfos.length>0){
			for(var index in photoInfos){
				console.log(photoInfos[index]);
				if(!photoInfos[index]) continue;

					utils.print(photoInfos[index]);

					var photoInfo = JSON.parse(photoInfos[index]);
					
					photos.push(photoInfo);

					// utils.print(photoInfo);
			}
		}
	}
	

}
// readListFile();

//路径是 /photos/upload  获取文件上传页面方法
router.get("/upload",function(req,res,next){
	res.render('photos/upload',{
		title:"Photo Upload"
	});
});


/*module.exports.form = function(req,res){
	res.render('photos/upload',{
		title:"Photo Upload"
	});
}*/


var join = path.join;
/*
uploadPath.any()，此处使用了multer中间件
为了将上传文件进行解析，否则找不到req.files[0]
req.files[0]打印如下：
	{ fieldname: 'photo[image]',
	  originalname: '633b9b6be57a2332.jpg',
	  encoding: '7bit',
	  mimetype: 'image/jpeg',
	  destination: 'D:/nodeJS/express/photo/routes/public/photos',
	  filename: '323e100a6c61c82e700eb3834542fc2d',
	  path: 'D:/nodeJS/express/photo/routes/public/photos/323e100a6c61c82e700eb3834542fc2d',
	  size: 6900 }
*/
//路径是 /photos/upload 文件上传方法
router.post("/upload",uploadPath.any(),function(req,res,next){

		var name = req.files[0].originalname;
		var imgPath = req.files[0].path;//图片临时保存路径

		var path = join(req.files[0].destination,name);//图片上传路径

		fs.rename(imgPath,path,function(err){
			if(err) return next(err);

			var photoInfo = {
				name:name,
				filename:name,
				path:"http://localhost:3000/photos/getPhoto/"+name
			};
			photos.push(photoInfo);

			
			//同步一行一行写入文件
			fs.writeFileSync(listFilePath,JSON.stringify(photoInfo),{encoding:'utf8',flag:'a'});
			fs.writeFileSync(listFilePath,os.EOL,{encoding:'utf8',flag:'a'});
			
			response = {
				message:'File upload successfully',
				filename:req.files[0].originalname
			};
			res.end(JSON.stringify(response));
		});
});

//图片列表
router.get("/getPhoto/:name",function(req,res,next){
	var path = __dirname+'/public/photos';
	// var name = req.query.name;//获取/getPhoto/:name?name=value这种参数
	var name = req.params.name;
	path = join(path,name);
	res.sendFile(path);	
});


router.get('/download/:name',function(req,res,next){
	var name = req.params.name;
	var dir = __dirname+'/public/photos';
	var path = join(dir,name);
	// res.sendFile(path,function(err){
	// 	if(err) 
	// 		console.log(err);
	// });
	res.download(path,'king_'+name);
});

module.exports = router;


/*
JSON.stringify  将Json对象变为json字符串
JSON.parse  将json字符串变为Json对象
*/

