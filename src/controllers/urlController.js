const shortid = require("shortid");
const urlModel = require("../models/urlModel");
const valid_url = require('valid-url');
const mongoose = require('mongoose');
const axios = require('axios');

const redis = require("redis");
const { promisify } = require("util");

//1. Connect to the redis server
const redisClient = redis.createClient(
  19949,
  "redis-19949.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("Ai50nD8uOQ40ib96RQLUPQ5YsiCJVGlB", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});


//2. Prepare the functions for each command

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
   // I can use axios here instead of regex to handle the long url
    let regex =/(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/
    if (!regex.test(longUrl)) return res.status(400).send({status:false, message:"please provide valid LongUrl."});
    
    const findUrl = await urlModel.findOne({longUrl:longUrl})
    if(findUrl){ const result = {
      urlCode: findUrl.urlCode,
      longUrl: findUrl.longUrl,
      shortUrl: findUrl.shortUrl
    };

    return res.status(200).send({ status: true, message: "this Url is already present", data:result});
  }
      const urlCode = shortid.generate().toLowerCase();
      const baseUrl = `http://localhost:3000/${urlCode}`;

      const data = { longUrl, baseUrl, urlCode };
      const createData = await urlModel.create(data);
    
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
