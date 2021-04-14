import { hash, compare } from "bcryptjs";
import  { Schema, model} from "mongoose";
import { sign } from "jsonwebtoken";
import  { SECRET } from "../constants";
import { randomBytes} from "crypto";
import  { pick } from  "lodash";


const EntrepreneurSchema =  new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        min: 6,
        max: 255
    },
    email: {
        type: String,
        required: true,
        unique: true,
        max: 255,
        min: 6
    },
    password: {
     type: String,
     required: true,
     max: 1024,
     min: 8
    },
    verified:{
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        required: false
    },
    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordExpiresIn: {
        type: Date,
        required: false
    },
}, { timestanps: true});

//Hooks if password is modified or not
EntrepreneurSchema.pre('save', async function(next){
    let entrepreneur = this;
    if(!entreprenuer.isModified("password")) return next();
    entrepreneur.password = await hash(entrepreneur.password, 10);
    next();
})

//To perform password verification when user tries to sign-in
EntrepreneurSchema.methods.comparePassword = async function(password){
    return await compare(password, this.password);
}

//To generate signIn token
EntrepreneurSchema.methods.generateJWT = async function(){
    let payload = {
        name: this.name,
        email: this.email,
        password: this.password,
        id: this._id,
    };

    return await sign(payload, SECRET, { expiresIn: "1 day"} );
};

//To generate password
EntrepreneurSchema.methods.generatePasswordReset = function(){
    this.resetPasswordExpiresIn =Date.now() + 36000000;
    this.resetPasswordToken = randomBytes(20).toString("hex");
}

//Iterating arraysusing pick from lodash to filter password from the DB
EntrepreneurSchema.methods.getEntrepreneurInfo = function(){
     return pick(this, ["_id", "name", "email", "verified"]);
 };

 const Entrepreneur =model("entrepreneurs", EntrepreneurSchema);
 export default Entrepreneur;
