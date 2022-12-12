const urlModel = require('../models/urlModel')

//==============================================Regex-AND-Validators======================================================//


//================================================Create-Url==============================================================//
const createShortUrl = async function(req,res){
    try{
        let options = {
            method: "get",
            url:""

        }

        
        let longUrl = req.body.longUrl



    }catch(error){
        return res.status(500).send({status:false, message: error.message})
    }
}
 module.exports = {createShortUrl}