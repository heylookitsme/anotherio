const express = require('express');
const app = express();
const serv = require('http').Server(app);

var SOCKET_LIST = {};

// serving index.html with express 
app.get('/', (req, res) => {
   res.sendFile(__dirname + '/client/index.html');
});
// serving all other static files from client/ folder
app.use('/client',express.static(__dirname + '/client'));

// easter egg  
app.get('/secret', (req, res) => {
   res.send("uwu,,,, ?");
});

serv.listen(69);
console.log("Server started.");

// todo: rewrite in mongoose (?)
var MongoClient = require('mongodb').MongoClient;

// opens up a socket for client <-> server communications 
const io = require('socket.io')(serv,{});
io.sockets.on('connection', (socket) => {
   console.log('socket connection');

   // signs user in when client emits signIn 
   socket.on('signIn',(data) => {
      console.log('code to signin');

      MongoClient.connect('mongodb://localhost:27017/wormverse', { useUnifiedTopology: true }, (err, db) => {
         if (err) throw err

         // mongodb weirdness
         var database  = db.db('wormverse');
         const collection = database.collection('worms');

         console.log("sign in credentials: " + data.username + " " + data.password);
         collection.findOne({username:data.username, password:data.password}, (err, item) => {
            if(err || !item) {
               socket.emit('signInResponse',{success:false});
            } else {
               var temp = item;
               temp["success"] = true;
               socket.emit('signInResponse',item);
            }
         })

      })

   });

   // signs a new user up when client emits signUp
   socket.on('signUp',(data) => {
      MongoClient.connect('mongodb://localhost:27017/wormverse', { useUnifiedTopology: true }, (err, db) => {
         if (err) throw err

         var database  = db.db('wormverse');
         const collection = database.collection('worms');

         // create a new worm with default settings, no items
         if(data && data.username && data.password){
            collection.insertOne({username: data.username, password: data.password, sprite: "1", color: "95d13c", secondColor: "0b187a", 
                                  pattern: "none", accessory: "none", numPies: "0", numCarrots: "0", numPeppermint: "0" }, (err, result) => {
               if(err) throw err
            })

            socket.emit('signUpResponse',{success:true});
         }else{
            socket.emit('signUpResponse',{success:false});
         }

      })

   });

   // todo: write code to save client modifications to worm attributes to database. 
   socket.on('modifySave',(data) => {
      
      console.log('code to save worm appearance');
   });

   // adds a specified item to players inventory
   socket.on('addItem',(data) => {
      MongoClient.connect('mongodb://localhost:27017/wormverse', { useUnifiedTopology: true }, (err, db) => {
         if (err) throw err

         // mongodb weirdness
         var database  = db.db('wormverse');
         const collection = database.collection('worms');

         collection.findOne({username: data.username}, (err, worm) => { 
            switch(data.item){
               case "pie":
                  collection.updateOne({username:data.username}, {'$set': {'numPies': Number(worm['numPies']) + 1}}, (err, item) => { console.log("pie added!") })
                  break; 
               case "peppermint": 
                  collection.updateOne({username:data.username}, {'$set': {'numPeppermint': Number(worm['numPeppermint']) + 1}}, (err, item) => { console.log("peppermint added!") })
                  break; 
               case "carrot":
                  collection.updateOne({username:data.username}, {'$set': {'numCarrot': Number(worm['numCarrot']) + 1}}, (err, item) => { console.log("carrot added!") })
                  break; 
               default: 
                  console.log("shrug emoji");
                  break; 
            }

         })

      })

      // todo: i dont know if its too painful to update it every time? we'll figure that out 
      // it would be nice to send a "batch" of how many items were farmed but could be blatantly exploitable
   });
});


