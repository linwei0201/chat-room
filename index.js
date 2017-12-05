var path = require('path');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var bodyParser = require('body-parser');

app.use(express.static(__dirname + '/styles'))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// in latest body-parser use like below.
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', path.join(__dirname , './views') );
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

var identityKey = 'skey';
app.use(session({
    name: identityKey,
    secret: 'chyingp',  // 用来对session id相关的cookie进行签名
    store: new FileStore(),  // 本地存储session（文本文件，也可以选择其他store，比如redis的）
    saveUninitialized: false,  // 是否自动保存未初始化的会话，建议false
    resave: false,  // 是否每次都重新保存会话，建议false
    cookie: {
        maxAge: 10 * 1000  // 有效期，单位是毫秒
    }
}));

app.get('/', function(req, res){
  var sess = req.session;
  var loginUser = sess.loginUser;
  var isLogined = !!loginUser;
  if(!isLogined){
    res.render('login');
    // res.sendFile(path.join(__dirname, './views/login.html'));
  }else{
    res.render('index', {
        isLogined: isLogined,
        name: loginUser || ''
    });
    // res.sendFile(path.join(__dirname, './templates/index.html'));
  }
});

http.listen(3100, function(){
  console.log('listening on *:3100');
});

// 登录接口
app.post('/login', function(req, res, next){

    var sess = req.session;
    var userName = req.body.username;

    if(userName){
        req.session.regenerate(function(err) {
            if(err){
                return res.json({ret_code: 2, ret_msg: '登录失败'});
            }

            req.session.loginUser = userName;
            res.redirect('/');
            // res.render('index', {
            //     isLogined: true,
            //     name: userName
            // });
        });
    }else{
        res.json({ret_code: 1, ret_msg: '用户名不能为空'});
    }
});


// 退出登录
app.get('/logout', function(req, res, next){
    // 备注：这里用的 session-file-store 在destroy 方法里，并没有销毁cookie
    // 所以客户端的 cookie 还是存在，导致的问题 --> 退出登陆后，服务端检测到cookie
    // 然后去查找对应的 session 文件，报错
    // session-file-store 本身的bug

    req.session.destroy(function(err) {
        if(err){
            res.json({ret_code: 2, ret_msg: '退出登录失败'});
            return;
        }

        // req.session.loginUser = null;
        res.clearCookie(identityKey);
        res.redirect('/');
    });
});

io.on('connection', function(socket){
  // console.log('a user connected');
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  // socket.on('disconnect', function(){
  //   console.log('user disconnected');
  // });
});
