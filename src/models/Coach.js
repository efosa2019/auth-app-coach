import { hash, compare } from "bcryptjs";
import  { Schema, model} from "mongoose";
import { sign } from "jsonwebtoken";
import  { SECRET } from "../constants";
import { randomBytes} from "crypto";
import  { pick } from  "lodash";


const CoachSchema =  new Schema({
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
}, { timestamps: true});

//Hooks if password is modified or not
CoachSchema.pre('save', async function(next){
    let coach = this;
    if(!coach.isModified("password")) return next();
    coach.password = await hash(coach.password, 10);
    next();
})

//To perform password verification when user tries to sign-in
CoachSchema.methods.comparePassword = async function(password){
    return await compare(password, this.password);
}

//To generate signIn token
CoachSchema.methods.generateJWT = async function(){
    let payload = {
        name: this.name,
        email: this.email,
        password: this.password,
        id: this._id,
    };

    return await sign(payload, SECRET, { expiresIn: "1 day"} );
};

//To generate password
CoachSchema.methods.generatePasswordReset = function(){
    this.resetPasswordExpiresIn =Date.now() + 36000000;
    this.resetPasswordToken = randomBytes(20).toString("hex");
}

//Iterating arraysusing pick from lodash to filter password from the DB
 CoachSchema.methods.getCoachInfo = function(){
     return pick(this, ["_id", "name", "email", "verified"]);
 };

 const Coach =model("coaches", CoachSchema);
 export default Coach;
