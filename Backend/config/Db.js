import mongoose from "mongoose";

const ConnectDb=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI,{});
        console.log("Database connected successfully");

    }
    catch(error){
        console.log("Error while connecting to database",error);
    }
}

export default ConnectDb;