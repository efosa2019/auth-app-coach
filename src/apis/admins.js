import { Admin } from "../models";
import { Router} from "express";
import { join } from 'path';
import { DOMAIN } from '../constants';
import sendMail from '../functions/email-sender';
import { randomBytes } from 'crypto';
import { SignUpValidations, AuthenticateValidations} from "../validators";
import Validator from "../middlewares/validator-middleware";


const router = Router();

/**
 * @description To create a new user account
 * @access Public
 * @api/admins/api/signup
 * @type POST
 */

router.post('/api/signup', SignUpValidations, Validator, async(req, res)=>{
   try{
    let { email } = req.body
    //Check if an admin exist
    let admin = await Admin.findOne({ email });
    if(admin){
        return res.status(400).json({
            success: false,
            message:"Email is already registered. Did you forget the password. Try resetting it."
        });
    }
     admin = new Admin({
         ...req.body,
        verificationCode: randomBytes(20).toString("hex"),
     });
     await admin.save();
     //Send an email to the admin with a verification link using functions email-sender
     let html = `
     <div>
     <h1>Hello, ${admin.email}</h1>
     <p>Please click the following link to verify your account</p>
     <a href="${DOMAIN}admins/verify-now/${admin.verificationCode}">Verify Now</a>
    </div>
     `;
    await sendMail(admin.email, "Verify Account", "Please verify Your Account.", html);
     return res.status(201).json({
         success: true,
         message: "Hurray! your account is created please verify your email address.",
     });
   }catch(err){
       return res.status(500).json({
           success: false,
           message: "An error occurred.",
       });

   }
});

/**
 * @description To verify a new user account via email
 * @access PUBLIC <Only via email>
 * @api/admins/verify-now/:verificationCode
 * @type GET
 */

router.get('/verify-now/:verificationCode', async(req, res)=>{
    try{
         let { verificationCode } = req.params;
         let admin = await Admin.findOne({verificationCode});
         if(!admin){
         return res.status(401).json({
        success: false,
        message: "Unauthorized access. Invalid verification code.",
    });
    }
admin.verified = true;
admin.verficationCode = undefined;
await admin.save()
return res.sendFile(join(__dirname, "../templates/verification-success.html"));
}catch(err){
    console.log("ERR", err.message);
return res.sendFile(join(__dirname, "../templates/errors.html"));
}
})

/**
 * @description To authenticate an user and auth token 
 * @access PUBLIC 
 * @api/admins/api/signin
 * @type POST
 */

 router.post('/api/signin', AuthenticateValidations, Validator, async(req, res)=>{
     try{
         let {email, password} = req.body;
          let admin = await  Admin.findOne({ email});
          if(!admin){
            return res.status(404).json({
            success: false,
            message: "Email not found.",
            });
          }
        if(!(await admin.comparePassword(password))){
            return res.status(401).json({
                success: false,
                message: "Incorrect password.",
                });
        }
        //if user is found
        let token = await admin.generateJWT();
        return res.status(200).json({
            success: true,
            admin: admin.getAdminInfo(),
            token: `Bearer ${token}`,
            message: "Hurray!  You are now Logged In.",
        })
     }catch{
        return res.status(500).json({
            success: false,
            message: "An error occurred.",
        });
     }
 });
export default router;
