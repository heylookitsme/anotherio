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
app.use('/node_modules/bootstrap',express.static(__dirname + '/node_modules/bootstrap'));

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

         // determines if the user with the given credentials actually exists, and notifies the
         // client accoringly. if user indeed exists, the user's (worm) data is sent back to the client 
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

   // saves client worm-attribute modifications to database. 
   socket.on('modifySave',(data) => {
      MongoClient.connect('mongodb://localhost:27017/wormverse', { useUnifiedTopology: true }, (err, db) => {
         if (err) throw err

         // mongodb weirdness
         var database  = db.db('wormverse');
         const collection = database.collection('worms');

         // updates the worm data
         collection.updateOne({username:data.username}, 
                              {'$set': {sprite:data.sprite, pattern:data.pattern, color:data.color, secondColor:data.secondColor, accessory:data.accessory}}, 
                              () => {console.log("worm appearance modified")}
         );

      })
     
   });

   // adds a single quantity of a specified item to a players inventory.
   socket.on('addItem',(data) => {
      MongoClient.connect('mongodb://localhost:27017/wormverse', { useUnifiedTopology: true }, (err, db) => {
         if (err) throw err

         // mongodb weirdness
         var database  = db.db('wormverse');
         const collection = database.collection('worms');

         // determines which item was farmed, and increments the users number of items 
         collection.findOne({username: data.username}, (err, worm) => { 
            switch(data.item){
               case "pie":
                  collection.updateOne({username:data.username}, {'$set': {numPies: Number(worm['numPies']) + 1}}, (err, item) => { console.log("pie added!") })
                  break; 
               case "peppermint": 
                  collection.updateOne({username:data.username}, {'$set': {numPeppermint: Number(worm['numPeppermint']) + 1}}, (err, item) => { console.log("peppermint added!") })
                  break; 
               case "carrot":
                  collection.updateOne({username:data.username}, {'$set': {numCarrots: Number(worm['numCarrots']) + 1}}, (err, item) => { console.log("carrot added!") })
                  break; 
               default: 
                  console.log("shrug emoji");
                  break; 
            }

         })

      })
   });
});


