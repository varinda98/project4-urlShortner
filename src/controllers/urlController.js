const shortid = require("shortid");
const urlModel = require("../models/urlModel");
const mongoose = require('mongoose');
const axios = require('axios')
const { GET_ASYNC, SET_ASYNC } = require('../redis/redis')

//========================================Regex-And-Validators============================================//
const isValid = function(longUrl){
if (typeof longUrl === "undefined" || longUrl === null ||
      (typeof longUrl === "string" && longUrl.length === 0)
    ) return res.status(400).send({ status: false, message: "Please enter a url" });
}
    function isValidURL(url) {
      let res = url.match(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/);
      return (res !== null) ? true : false
  };


//----------------------------------------------------------------------------------------//
//                                1. API -  POST/url/shorten
//---------------------------------------------------------------------------------------//

const createShortUrl = async function (req, res) {
  try {
    const body = req.body;
//==================Checking-Body=======================//
    if (Object.keys(body).length === 0) return res.status(400).send({ status: false, message: "Invalid Request Body: Body Empty." });

    let { longUrl } = body;   //destructuring loNGUrl in body

    if(isValid(longUrl)){return res.status(400).send({status:false, message:"please provide the LongUrl"})}

    if(!isValidURL(longUrl)) return res.status(400).send({ status: false, message: "Please provide LongUrl in correct format" })

//=================Getting-In-Redis=====================//
    let cacheUrl = await GET_ASYNC(`${longUrl}`)// we are getting in string format
    if (cacheUrl) {
      let checkUrlInCache = JSON.parse(cacheUrl)
      return res.status(200).send({ status: true, message: "this Url is coming from cache ", data: checkUrlInCache })
    }

//=================Checking-URL-BY-Using-Axios===================// 
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

//====================Generating-ShortUrl=====================//
    const urlCode = shortid.generate().toLowerCase();
    const shortUrl = `http://localhost:3000/${urlCode}`;

    const data = { longUrl: longUrl, shortUrl: shortUrl, urlCode: urlCode };

//====================Getting-In-Db=============================//
    const checkUrlInDb = await urlModel.findOne({ longUrl: longUrl }).select({_id:0, __v:0})
    if (checkUrlInDb) {
      await SET_ASYNC(`${longUrl}`,24 * 60 * 60, JSON.stringify(checkUrlInDb))
      return res.status(200).send({ status: true, message: "Url comming from Db", data:checkUrlInDb})
    }

    await urlModel.create(data);

//===================Create-In-Redis======================//
    await SET_ASYNC(`${longUrl}`,24 * 60 * 60, JSON.stringify(data))

    return res.status(201).send({ status: true, message: "Successfully Generated Short URL.", data: data});

  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//----------------------------------------------------------------------------------------
//                                2. API -  GET/:urlCode
//----------------------------------------------------------------------------------------

const getUrlByParams = async function (req, res) {
  try {
    let urlCode = req.params.urlCode;
    if (!urlCode) { return res.status(400).send({ status: false, message: "please provide the UrlCode" }) }

    if (!shortid.isValid(urlCode)) return res.status(400).send({ status: false, message: "Please provide a valid URL code" })

    let cacheUrl = await GET_ASYNC(`${urlCode}`)// we are getting in string format
    let objCache = JSON.parse(cacheUrl)// converting into object format  
    if (objCache) {
      return res.status(302).redirect(objCache.longUrl)
    }

    let findUrlCode = await urlModel
      .findOne({ urlCode: urlCode })

    if (!findUrlCode) return res.status(404).send({ status: false, message: "urlCode NOT Found" });
    await SET_ASYNC(`${urlCode}`, 24 * 60 * 60, JSON.stringify(findUrlCode))
    return res.status(302).redirect(findUrlCode.longUrl);

  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
}

module.exports = { createShortUrl, getUrlByParams };
