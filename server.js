/*Define dependencies.*/

var express=require("express");
var multer  = require('multer');
var app=express();
var path=require("path");
var fs = require("fs");
var done=false;

/*Configure the multer.*/

function cmd_exec(cmd, args, cb_stdout, cb_end){
        var spawn = require('child_process').spawn,
                child = spawn(cmd, args),
                me = this;
        me.exit = 0;
        child.stdout.on('data', function(data){cb_stdout(me, data);});
        child.stdout.on('end', function(){cb_end(me);});
}

app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use('/uploads',  express.static(__dirname + '/uploads'));

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
  //TODO  mimic a console call,replace as real call
  foo = new cmd_exec('netstat', ['-rn'],
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

app.get('/find', function(req, res){
  var fileList = getFiles("uploads/");
  var postList = [];
  for(var i = 0, len = fileList.length; i < len; ++i){
    postList.push({
      'name': fileList[i],
      'origin': fileList[i],
      'seg': fileList[i],
      'salient': fileList[i],
      'border': fileList[i],
      'turn': fileList[i],
      'denoise': fileList[i],
      'deskew': fileList[i],
      'binarization': fileList[i],
      'text':fileList[i]
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
app.listen(4000,function(){
    console.log("Working on port 4000");
});

