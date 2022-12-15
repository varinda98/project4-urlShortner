const mongoose=require ("mongoose")

const urlSchema= new mongoose.Schema({
    urlCode:{
        type:String,
        require:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    longUrl:{
        type:String,
        require:true,
        trim:true
    },
    shortUrl:{
        type:String,
        require:true,
        unique:true,
        trim:true
    }
})


module.exports = mongoose.model("Url", urlSchema)