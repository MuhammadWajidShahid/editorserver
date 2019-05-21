const express = require("express");
var spawn = require("child_process").spawn;
let app = express();
// let server = require("http").createServer(app);
let server =app.listen(process.env.PORT||800 , console.log("server running"))
let fs = require("fs");
let bodyparser = require("body-parser");
const io = require("socket.io")(server);
const pty = require("node-pty");
const rmdir= require('rimraf');
var os = require('os');
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
    // For all websocket data send it to the shell
    socket.on('message', (msg) => {
        shell.write(msg);
        // console.log(msg)
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
            if (!exit)
                shell.kill();
            var proc = spawn('gcc', [`./programs/${socket.id}` + '/' + `program` + ".cpp", "-o", `./programs/${socket.id}` + '/' + `program`, '-lstdc++']);
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
                }
                else {
                    console.log(f);
                    if (f) {
                        var name = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
                        shell = pty.spawn(name
                            , ["./program.exe"]
                            , {
                                name: 'xterm-color',
                                cwd: `${__dirname}/programs/${socket.id}`,
                                env: process.env,
                                shell: true
                            });
                            exit = false;
                        socket.emit("running", true);
                        // For all shell data send it to the websocket
                        shell.on('data', (data) => {
                            if(!exit)
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
                            socket.emit("responce", '\n');
                            socket.emit("exit", true);
                        });
                    }
                }

            });
            if (f) {
                clearTimeout(timeout);
            }
        }


    });

    socket.on("disconnect",  function () {
        if (!exit)
         shell.kill();

        rmdir(`./programs/${socket.id}`,(err)=>{
            if(err)
            console.log(err)
        })
        console.log("disconnect" + socket.id);
    })
});

app.get("/",(req,res)=>{
    res.send("jlo");
})






// server.listen( process.env.PORT||800 , console.log("server running"))