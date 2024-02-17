const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoClient } = require("mongodb");

const db = new MongoClient("mongodb://localhost:27017", { useNewUrlParser: true, useUnifiedTopology: true });

// Use cors middleware
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());


let userDb;
let roomDb;

server.listen(3001, async() => {
    console.log('listening on *:3001');
    await db.connect().then(() => console.log('Database Connected!'));
    userDb = await db.db("peerchat").collection("user")
    roomDb = await db.db("peerchat").collection("room")
});

app.get('/', (req, res) => {
    res.send("server is running");
});
app.post('/createUser', async(req, res,next) => {
    const { username,name, password } = req.body;
   
    const data = await userDb.find().toArray()
    console.log("find", data)
    if (data.length > 0)
    {
   res.json({
            result:"exist"
   })
        return
    }
    else 
    userDb.insertOne({
        username:name,
        name: name,
        password:password
    })
   res.json({
       result:"created"
   })
    
})



io.on('connection', socket => {
    
    // Generate a unique username or use some identifying information
    const username = `User${socket.id.substring(0, 5)}`;

    console.log('Client connected', username);

    socket.on("joinRoom", async (userInfo, callback) => {
        if (userInfo) {
           
            socket.join(userInfo.room);
            await roomDb.insertOne(userInfo)
            callback("Room joined successfully");
            io.to(room).emit("enterRoom", socket.id)
        } else {
            console.error("Invalid room name");
        }
    });

    
    // socket.on("enter", (data) => {
    //     console.log("data",room1)
      
    //     socket.to(room1).emit("enterRoom","enter")
    // })
   
    socket.emit('username', username);

    socket.on('disconnect', () => {
        // console.log(`User ${username} disconnected`);
    });

    socket.on('message', (data) => {
        const response = {
            message: data.message,
            username: data.user,
        };
        io.emit('getData', response);
        // socket.broadcast.emit('getData', response);
    });
});



