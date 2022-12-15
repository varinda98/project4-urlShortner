const shortid = require("shortid");
const urlModel = require("../models/urlModel");
const valid_url = require('valid-url');
const mongoose = require('mongoose');
const axios = require('axios');
const validator = require("validator");

const redis = require("redis");
const { promisify } = require("util");


const redisClient = redis.createClient(
  16425,
  "redis-16425.c8.us-east-1-2.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);

redisClient.auth("PPhFqG0cDE9L2a0aSQePySb5RMfWgzWk", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

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
    ) return res.status(400).send({ status: false, message:"Please enter a valid <longUrl>."});

    let regex =/(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/
    if (!regex.test(longUrl)) return res.status(400).send({status:false, message:"please provide valid LongUrl."});

let cachesUrlData = await GET_ASYNC(`${req.body.longUrl}`);

if (cachesUrlData) {
  return res.status(201).send({
    status: true,
    message: "URL Data coming from Cache.",
    data: JSON.parse(cachesUrlData),
  });
}

      const urlCode = shortid.generate().toLowerCase();
      const baseUrl = `http://localhost:3000/${urlCode}`;
     
      const data = { longUrl, shortUrl, urlCode };
      const createData = await urlModel.create(data);
    
      const result = {
        urlCode: createData.urlCode,
        longUrl: createData.longUrl,
        shortUrl: createData.shortUrl,
      };

await SET_ASYNC(`${req.body.longUrl}`, JSON.stringify(result));

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

    let cachesUrlData = await GET_ASYNC(`${urlCode}`);

    //convert to object
    const urlData = JSON.parse(cachesUrlData);
    if (cachesUrlData) {
      return res.status(302).redirect(urlData.longUrl);
    } else { var findUrlCode = await urlModel
        .findOne({urlCode:urlCode})

    if(!findUrlCode) return res.status(404).send({status:false, message:"urlCode NOT Found"});
    }
    await SET_ASYNC(`${urlCode}`, JSON.stringify(findUrlCode));  
    return res.status(302).redirect(findUrlCode.longUrl);

  }catch(error) {
    return res.status(500).send({status:false, message:error.message});
 }
}

module.exports = {createShortUrl, getUrlByParams};

