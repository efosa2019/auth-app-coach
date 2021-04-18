import { Admin } from "../models";
import { Router} from "express";
import { join } from 'path';
import { DOMAIN } from '../constants';
import  { userAuth } from '../middlewares/auth-dashboard';
import sendMail from '../functions/email-sender';
import { randomBytes } from 'crypto';
import { SignUpValidations, AuthenticateValidations, ResetPassword} from "../validators";
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
    //Check if an admin already exist
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


 /**
 * @description To get authenticated user dashboard
 * @access Private
 * @api/admins/api/dashboard
 * @type GET
 */

 router.get('/api/dashboard', userAuth, async(req, res)=>{
     console.log("REQ", req);
    return res.status(200).json({
    user: req.user,
 });
 })


  /**
 * @description To intitiate the password reset process
 * @access Public
 * @api/admins/api/reset-password
 * @type PUT
 */
router.put('/api/reset-password', ResetPassword, Validator,  async(req, res)=>{
    try{
     let { email } = req.body;
     let admin = await Admin.findOne({ email });
     if(!admin){
        return res.status(404).json({
            success: false,
            message: "Admin with the email is not found.",
        });
     }
     admin.generatePasswordReset();
     await admin.save();
     //Sent the password reset link to the email
     let html = `
     <div>
     <h1>Hello, ${admin.email}</h1>
     <p>Please click the following link to reset your password.</p>
     <p>If this password reset not created by you then you can ignore this email.</p>
     <a href="${DOMAIN}admins/reset-password-now/${admin.resetPasswordToken}">Reset Now</a>
    </div>
     `;
    await sendMail(admin.email, "Reset Password", "Please reset your password.", html);
     return res.status(200).json({
        success: true,
        message: "Password reset link is sent to your email.",
    });
    }catch(err){
        return res.status(500).json({
            success: false,
            message: "An error occurred.",
        });
    }

   });


  /**
 * @description To render password reset page
 * @access Restricted via email
 * @api/admins/reset-password-now/:resetPasswordToken
 * @type GET
 */

router.get('/reset-password-now/:resetPasswordToken',  async(req, res)=>{
    try{
    let { resetPasswordToken } = req.params;
    let admin = await Admin.findOne({resetPasswordToken, resetPasswordExpiresIn: {$gt: Date.now()}, });
    if(!admin){
        return res.status(401).json({
            success: false,
            message: "Password reset token is invalid or has expired.",
        });
    }
    return res.sendFile(join(__dirname, "../templates/password-reset.html")); //Remove after testing
    }catch(err){
        return res.sendFile(join(__dirname, "../templates/errors.html"));
    }
});


/**
 * @descriptionTo To reset the password
 * @access Restricted via email
 * @api/admins/api/reset-password-now
 * @type POST
 */

 router.post('/api/reset-password-now', async(req, res)=>{
     try{
    let { resetPasswordToken, password } = req.body;
        let admin = await Admin.findOne({resetPasswordToken, resetPasswordExpiresIn: {$gt: Date.now()}, });
        if(!admin){
            return res.status(401).json({
                success: false,
                message: "Password reset token is invalid or has expired.",
            });
        }
        admin.password = password;
        admin.resetPasswordToken = undefined;
        admin. resetPasswordExpiresIn = undefined;
        await admin.save();

         //Send confirmation of successful password change
     let html = `
     <div>
     <h1>Hello, ${admin.email}</h1>
     <p>Your password reset is successfully.</p>
     <p>If this reset is not done by you then you can contact us immediately.</p>
    
    </div>
     `;
    await sendMail(admin.email, "Reset Password Successful", "Your password is changed.", html);
        return res.status(200).json({
            success: true,
            message: "Your password reset is complete and successful. Login with your new password",
        });
        }catch(err){
            return res.status(500).json({
                success: false,
                message: "Something went wrong",
            });
        }

 });
 
export default router;
