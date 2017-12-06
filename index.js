var path = require('path');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');


app.use(express.static(__dirname + '/styles'))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// in latest body-parser use like below.
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', path.join(__dirname , './views') );
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

app.use(cookieParser());

app.get('/', function(req, res){
  var loginUser = req.cookies.loginUser;
  var isLogined = !!loginUser;

  if(!isLogined){
    res.render('login');
  }else{
    res.render('index', {
        isLogined: isLogined,
        name: loginUser || ''
    });
  }
});

http.listen(3100, function(){
  console.log('listening on *:3100');
});

// 登录接口
app.post('/login', function(req, res, next){
    var userName = req.body.username;

    if(userName){
        res.cookie('loginUser', userName, {maxAge: 60 * 1000});
        res.redirect('/');

    }else{
        res.json({ret_code: 1, ret_msg: '用户名不能为空'});
    }
});


// 退出登录
app.get('/logout', function(req, res, next){

    res.cookie('loginUser', '');
    res.redirect('/');
});

io.on('connection', function(socket){
  // console.log('a user connected');
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  socket.on('chat inputing', function(data){
    io.emit('chat inputing', data);
  });

  // socket.on('disconnect', function(){
  //   console.log('user disconnected');
  // });
});
