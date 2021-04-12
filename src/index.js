import cors from "cors";
import consola from "consola";
import express from "express";
import mongoose from "mongoose";
import { json } from "body-parser";

//Import application constants
import { DB, PORT} from "./constants";

//Router exports
import adminApis from "./apis/admins"

//Initialize express app
const app = express();

//Apply application middlewares
app.use(cors());
app.use(json());

//Inject Sub router and apis
app.use("/admins", adminApis);

const main = async() => {
    try{
        //Connect to Database
       await  mongoose.connect(DB, {
            useNewUrlParser: true,
            useFindAndModify: true,
            useUnifiedTopology: true,
        });
       consola.success("DATABASE CONNECTED..");
       //Start application listening for request
       app.listen(PORT, () => consola.success(`Server started on ${PORT}`));
    }catch(err){
      consola.error(`Unable to start server \n${err.message}`);
    }
};

main();