const redis = require('redis');
const {promisify} = require('util')

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
  
  const SET_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
  const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

  
  module.exports = {GET_ASYNC, SET_ASYNC}


