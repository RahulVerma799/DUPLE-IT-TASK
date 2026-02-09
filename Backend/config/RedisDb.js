import Redis from "ioredis";

const redis =new Redis(process.env.REDIS_URL);

redis.on("connect",()=>{
    console.log("Connected to REDIS Successfully");

});

redis.on("error",(error)=>{
    console.log("Error while connecting to REDIS",error);
});

export default redis;