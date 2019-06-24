const express = require("express");
var spawn = require("child_process").spawn;
let app = express();
// let server = require("http").createServer(app);
let server = app.listen(process.env.PORT || 800, console.log("server running"))
let fs = require("fs");
let bodyparser = require("body-parser");
const io = require("socket.io")(server);
const pty = require("node-pty");
const rmdir = require('rimraf');
var os = require('os');
const bcrypt = require('bcrypt');
const saltRounds = 10;
require("./config/db-config.js");
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require("express-session")
app.use(session({ secret: "//+)*7fdre!23dfsdf@#323#@$dsf" }));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json())
app.use(express.static("./build"));
app.get("/", (req, res) => {
    res.send("file");
});
io.on("connection", socket => {
    console.log("connected" + socket.id);
    let shell;
    let exit = true;
    let proc;
    let stop=false;
    // For all websocket data send it to the shell
    socket.on('message', (msg) => {
        shell.write(msg);
        // console.log(msg)
    });
    socket.on('stopcomp', (msg) => {
        if(msg)
        {
            if(proc)
            proc.kill();
            if(!exit)
            shell.kill();
            stop=true;
            socket.emit("exit", true);
        }
    });
    socket.on('stoprun', (msg) => {
        if(msg&&shell)
        {
            shell.kill();
        }
    });
    socket.on("runcpp", (data) => {
        console.log(data)
        let done = true;
        if (!fs.existsSync(`./programs/${socket.id}`)) {

            fs.mkdirSync(`./programs/${socket.id}`, (err) => {
                if (err)
                    done = false;
                else {
                    done = true;
                }
            })
        }
        fs.writeFile(`./programs/${socket.id}/program.cpp`, data.code, (err) => {
            if (err)
                done = false;
            else
                done = true;
        });
        console.log(done)
        if (done) {
            stop=false;
            if (!exit)
                shell.kill();
             proc = spawn('g++', [`./programs/${socket.id}` + '/' + `program` + ".cpp", "-o", `./programs/${socket.id}` + '/' + `program`]);
            var stdout = "";
            var stderr = "";
            var f = false;
            var timeout = setTimeout(function () {
                proc.stdin.pause();
                proc.kill();
                f = true;
            }, 2000);
            proc.stderr.on('data', function (_stderr) {
                stderr += _stderr;
            });
            proc.stderr.on('end', function () {
                proc.kill();
                f = true;
            });
            proc.on('close', function (code) {
                proc.kill();
                f = true;
                if (stderr) {
                    console.log(stderr)
                    var find = `./programs/${socket.id}` + '/' + `program` + ".cpp";
                    var re = new RegExp(find, 'g');
                    stderr=stderr.replace(re,'');
                    socket.emit("err", stderr);
                }
                else {
                    if(stdout)
                    socket.emit("err", stdout);
                    else{
                    if(!stop){
                    console.log(f);
                    socket.emit("err", "Compilation Succeded");
                    if (f) {
                        var name = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
                        shell = pty.spawn(name, ["-c","./program"], {
                            name: 'xterm-color',
                            cols: 80,
                            rows: 30,
                            cwd: `${__dirname}/programs/${socket.id}`,
                            // cwd: process.env.HOME,
                            env: process.env
                          });
                        // shell = pty.spawn(name
                        //     // , ["./program"]
                        //     , {
                        //         name: 'xterm-color',
                        //         // cwd: `${__dirname}/programs/${socket.id}`,
                        //         env: process.env,
                        //         shell: true
                        //     });
                        exit = false;
                        socket.emit("running", true);
                        // For all shell data send it to the websocket
                        shell.on('data', (data) => {
                            if (!exit)
                                socket.emit("responce", data);
                            // console.log(data)
                        });
                        // // For all websocket data send it to the shell
                        // socket.on('message', (msg) => {
                        //     shell.write(msg);
                        //     console.log(msg)
                        // });
                        shell.on("exit", d => {
                            exit = true;
                            console.log("exited");
                            // socket.emit("responce", '\n');
                            socket.emit("exit", true);
                        });
                    }
                }
            }
                }

            });
            if (f) {
                clearTimeout(timeout);
            }
        }


    });

    socket.on("disconnect", function () {
        if (!exit)
            shell.kill();

        rmdir(`./programs/${socket.id}`, (err) => {
            if (err)
                console.log(err)
        })
        console.log("disconnect" + socket.id);
    })
});

app.get("/", (req, res) => {
    res.send("jlo");
})
let users=require("./models/user-model");
app.post("/adduser",(req,res)=>{
    users.findOne({email:req.body.email},(err,user)=>{
if(!err){
    if(!user){
    bcrypt.hash(req.body.pass, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        if(!err){
    let user=new users({
        firstname:req.body.fname,
        lastname:req.body.lname,
        email:req.body.email,
        password:hash,
    });
    user.save((err,user)=>{
        if(err)
        console.log(err)
        else
        res.json({success:true});
    });
}
});
    }
else{
    res.json({success:false});
}
}

});
})

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(
    {usernameField:"email", passwordField:"password"},
    function (email, password, next) {

        // var user;
         users.findOne({email:email},(err,user)=>{
            // if(!err)
            // user=nuser;
            if (user) {
                bcrypt.compare(password, user.password, function(err, res) {
                    // res == true
                    if(!err&&res)
                    next(null, user);
                    else {
                        next(null, false);
                    }
                });
            } 
        });
    }));

    passport.serializeUser(function (user, next) {
        next(null, user._id);
    });
    
    passport.deserializeUser(function (id, next) {
        // var user = users.find((user) => {
        //     return user._id === id;
        // });
        users.findOne({_id:id},(err,user)=>{
            if(!err&&user)
            next(null, user);
        })
    
    });

    app.post('/login',
    // passport.authenticate('local'), 
    function (req, res,next) {
        // res.send("success");
        passport.authenticate('local', function(err, user, info) {
            if (err) { return next(err); }
            if (!user) { return res.json({success:false}); }
            req.logIn(user, function(err) {
              if (err) { return next(err); }
              res.json({success:true,user:user});
            //   return res.redirect('/users/' + user.username);
            });
          })(req, res, next);
    });
    app.get('/mainpage',(req,res)=>{
        if(req.isAuthenticated())
        res.json({success:true,user:req.user});
        else
        res.json({success:false,});
    });
    app.get('/logout', function(req, res){
        req.logout();
        res.json({success:true});
      });
      var programsRoute=require("./routes/programs-routes")
app.use("/user/programs",programsRoute)

// server.listen( process.env.PORT||800 , console.log("server running"))