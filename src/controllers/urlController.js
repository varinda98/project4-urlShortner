const shortid = require("shortid");
const urlModel = require("../models/urlModel");
const valid_url = require('valid-url');
const mongoose = require('mongoose');
const axios = require('axios')
const {GET_ASYNC, SET_ASYNC} = require('../redis/redis')

//----------------------------------------------------------------------------------------//
//                                1. API -  POST/url/shorten
//---------------------------------------------------------------------------------------//

const createShortUrl = async function(req, res) {
  try {
    const body = req.body;

    if (Object.keys(body).length === 0)return res.status(400).send({status:false, message:"Invalid Request Body: Body Empty."});
    
    let { longUrl } = body;

    if (typeof longUrl === "undefined" || longUrl === null ||
       (typeof longUrl === "string" && longUrl.length === 0)
    ) return res.status(400).send({ status: false, message:"Please enter a url"});
   

  let cacheUrl = await GET_ASYNC(`${longUrl}`)// we are getting in string format
  let checkUrlInCache = JSON.parse(cacheUrl)
   if(checkUrlInCache) return res.status(200).send({ status:true, message: `this url is coming from cache - ${checkUrlInCache.shortUrl}` })

    let obj = {
      method: "get",
      url: longUrl
  }

  let urlFound = false;
  await axios(obj)
      .then((res) => {
          if (res.status == 201 || res.status == 200) urlFound = true;
      })
      .catch((err) => { });
  if (!urlFound) {
      return res.status(400).send({ status: false, message: "Please provide valid LongUrl" })
  }

  const checkUrlInDb = await urlModel.findOne({ longUrl: longUrl }) 
  if(checkUrlInDb)await SET_ASYNC(`${longUrl}`, JSON.stringify(checkUrlInDb), 'PX', 86400)
  if (checkUrlInDb) return res.status(400).send({ status:false, message: `LongUrl already used - ${checkUrlInDb.shortUrl}` })

    
      const urlCode = shortid.generate().toLowerCase();
      const shortUrl = `http://localhost:3000/${urlCode}`;

      const data = { longUrl, shortUrl, urlCode };
      const createData = await urlModel.create(data);
      await SET_ASYNC(`${longUrl}`, JSON.stringify(createData), 'PX', 86400)
    
      const result = {
        urlCode: createData.urlCode,
        longUrl: createData.longUrl,
        shortUrl: createData.shortUrl,
      };

      return res.status(201).send({ status: true, message: "Successfully Generated Short URL.", data:result});
    
  }catch(error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//----------------------------------------------------------------------------------------
//                                2. API -  GET/:urlCode
//----------------------------------------------------------------------------------------

const getUrlByParams = async function(req,res){
   try {
    let urlCode = req.params.urlCode;
    if(!urlCode){return res.status(400).send({status:false, message:"please provide the UrlCode"})}

//if(!valid_url(urlCode)){return res.status(400).send({status:false, message:"please provide the valid urlCode"})}

    let findUrlCode = await urlModel
        .findOne({urlCode:urlCode})

    if(!findUrlCode) return res.status(404).send({status:false, message:"urlCode NOT Found"});
      return res.status(302).redirect(findUrlCode.longUrl);

  }catch(error) {
    return res.status(500).send({status:false, message:error.message});
 }
}

module.exports = {createShortUrl, getUrlByParams};
