/*Define dependencies.*/

var express=require("express");
var multer  = require('multer');
var app=express();
var path=require("path");
var fs = require("fs");
var done=false;

var dirBase = "images/";
var imgDirs = [dirBase + "seg", dirBase + "salient", dirBase + "border", dirBase + "turn", dirBase + "denoise", dirBase + "deskew", dirBase + "binarize"];
var textDir = "ocrResult";

function mkdirSync(dirpath,mode){
    var path = require("path");
    arr = dirpath.split("/");
    mode = mode || 0775;
    if(arr[0]==="."){//处理 ./aaa
        arr.shift();
    }
    if(arr[0] == ".."){//处理 ../ddd/d
        arr.splice(0,2,arr[0]+"/"+arr[1])
    }
    function inner(cur){
        if(!path.existsSync(cur)){//不存在就创建一个
            fs.mkdirSync(cur, mode)
        }
        if(arr.length){
            inner(cur + "/"+arr.shift());
        }
    }
    arr.length && inner(arr.shift());
}

function mkdirs(){
    for (var i in imgDirs)
    {
	console.log(imgDirs[i]);
        mkdirSync(imgDirs[i]);
    }
    mkdirSync(textDir);
}


/*Configure the multer.*/

function cmd_exec(cmd, args, cb_stdout, cb_end){
	console.log("args:" + args);
        var spawn = require('child_process').spawn,
                child = spawn(cmd, args),
                me = this;
        me.exit = 0;
        child.stdout.on('data', function(data){cb_stdout(me, data);});
        child.stdout.on('end', function(){cb_end(me);});
}

app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use('/uploads',  express.static(__dirname + '/uploads'));
app.use('/images',  express.static(__dirname + '/images'));
//app.use('/js',express.static(path.join(__dirname + 'bower_components')));

app.use(multer({ dest: './uploads/',
  rename: function (fieldname, filename) {
      return filename+Date.now();
  },
onFileUploadStart: function (file) {
  console.log(file.originalname + ' is starting ...')
},
onFileUploadComplete: function (file) {
  console.log(file.fieldname + ' uploaded to  ' + file.path)
  done=true;
  
  //process image
  mkdirs();
  foo = new cmd_exec('./image_process', ['-s', '-i', file.path, '-o', textDir, '-c', 'sn.conf'],
    function(me, data){me.stdout += data.toString(0);},
    function(me) {me.exit=1;});

  function log_console(){
    console.log(foo.stdout);
  }

  setTimeout(log_console, 250);
}
}));

/*Handling routes.*/

app.get('/',function(req,res){
      res.sendfile("index.html");
});

app.get('/list', function(req, res){
  res.sendfile("list.html");
});

function getFiles(dir,files_){
    files_ = files_ || [];
    if (typeof files_ === 'undefined') files_=[];
    var files = fs.readdirSync(dir);
    for(var i in files){
        if (!files.hasOwnProperty(i)) continue;
        var name = dir+'/'+files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name,files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

function getFileName(path)         
{
    var arrpfn = path.split("/");
    return arrpfn[arrpfn.length - 1];
}


app.get('/find', function(req, res){
  var fileList = getFiles("uploads/");
  var postList = [];
  for(var i = 0, len = fileList.length; i < len; ++i){
    var filename = getFileName(fileList[i]);
    if(typeof(foo) != 'undefined')
    	console.log(foo.stdout);
    console.log(fileList[i]);
    postList.push({
      'name': filename,
      'origin': fileList[i],
      'seg': imgDirs[0] +"/"+ filename,
      'salient': imgDirs[1]+"/"+filename,
      'border': imgDirs[2]+"/"+filename,
      'turn': imgDirs[3]+"/"+filename,
      'denoise': imgDirs[4]+"/"+filename,
      'deskew': imgDirs[5]+"/"+filename,
      'binarization': imgDirs[6]+"/"+filename,
      'text':filename
    });
  }
  res.send({
    'testcase':postList
  });
});

app.post('/api/photo',function(req,res){
  if(done==true){
    console.log(req.files);
    res.sendfile("ok.html");
  }
});

/*Run the server.*/
app.listen(3000,function(){
    console.log("Working on port 3000");
});

