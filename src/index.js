const express = require('express');
const route = require('./routes/route')
const mongoose = require('mongoose');
const  app = express();

app.use(express.json());

mongoose.connect("mongodb+srv://varinda:Flipkart@newproject.7qwzr8u.mongodb.net/group16Database",{
    useNewUrlParser:true
})
.then(()=> console.log("MongoDb is connected"))
.catch((error)=> console.log(error))

app.use('/', route)

app.listen(process.env.PORT ||3000 , function(){
    console.log("Express is running on Port" + (process.env.PORT || 3000))
})

