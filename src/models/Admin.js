import { hash, compare } from "bcryptjs";
import  { Schema, model} from "mongoose";
import { sign } from "jsonwebtoken";
import  { SECRET } from "../constants";
import { randomBytes} from "crypto";
import  { pick } from  "lodash";


const AdminSchema =  new Schema({
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
AdminSchema.pre('save', async function(name){
    let admin = this;
    if(!admin.isModified("password")) return next();
    admin.password = await hash(admin.password, 10);
    next();
})

//To perform password verification when user tries to sign-in
AdminSchema.methods.comparePassword = async function(password){
    return await compare(password, this.password);
}


//To generate signIn token
AdminSchema.methods.generateJWT = async function(password){
    let payload = {
        name: this.name,
        email: this.email,
        password: this.password,
        id: this._id,
    };

    return await sign(payload, SECRET, { expiresIn: "1 day"} );
};

//To generate password
AdminSchema.methods.generatePasswordReset = function(){
    this.resetPasswordExpiresIn =Date.now() + 36000000;
    this.resetPasswordToken = randomBytes(20).toString("hex");
}

//Iterating arraysusing pick from lodash to filter password from the DB
 AdminSchema.methods.getAdminInfo = function(){
     return pick(this, ["_id", "name", "email"]);
 };

 const Admin =model("admins", AdminSchema);
 export default Admin;