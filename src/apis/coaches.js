import { Coach } from "../models";
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
 * @api/coaches/api/signup
 * @type POST
 */

router.post('/api/signup', SignUpValidations, Validator, async(req, res)=>{
   try{
    let { email } = req.body
    //Check if an coach already exist
    let coach = await Coach.findOne({ email });
    if(coach){
        return res.status(400).json({
            success: false,
            message:"Email is already registered. Did you forget the password. Try resetting it."
        });
    }
     coach = new Coach({
         ...req.body,
        verificationCode: randomBytes(20).toString("hex"),
     });
     await coach.save();
     //Send an email to the coach with a verification link using functions email-sender
     let html = `
     <div>
     <h1>Hello, ${coach.email}</h1>
     <p>Please click the following link to verify your account</p>
     <a href="${DOMAIN}coaches/verify-now/${coach.verificationCode}">Verify Now</a>
    </div>
     `;
    await sendMail(coach.email, "Verify Account", "Please verify Your Account.", html);
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
 * @api/coaches/verify-now/:verificationCode
 * @type GET
 */

router.get('/verify-now/:verificationCode', async(req, res)=>{
    try{
         let { verificationCode } = req.params;
         let coach = await Coach.findOne({verificationCode});
         if(!coach){
         return res.status(401).json({
        success: false,
        message: "Unauthorized access. Invalid verification code.",
    });
    }
coach.verified = true;
coach.verficationCode = undefined;
await coach.save()
return res.sendFile(join(__dirname, "../templates/verification-success.html"));
}catch(err){
    console.log("ERR", err.message);
return res.sendFile(join(__dirname, "../templates/errors.html"));
}
})

/**
 * @description To authenticate an user and auth token 
 * @access PUBLIC 
 * @api/coaches/api/signin
 * @type POST
 */

 router.post('/api/signin', AuthenticateValidations, Validator, async(req, res)=>{
     try{
         let {email, password} = req.body;
          let coach = await  Coach.findOne({ email});
          if(!coach){
            return res.status(404).json({
            success: false,
            message: "Email not found.",
            });
          }
        if(!(await coach.comparePassword(password))){
            return res.status(401).json({
                success: false,
                message: "Incorrect password.",
                });
        }
        //if user is found
        let token = await coach.generateJWT();
        return res.status(200).json({
            success: true,
            coach: coach.getCoachInfo(),
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
 * @api/coaches/api/dashboard
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
 * @api/coaches/api/reset-password
 * @type PUT
 */
router.put('/api/reset-password', ResetPassword, Validator,  async(req, res)=>{
    try{
     let { email } = req.body;
     let coach = await Coach.findOne({ email });
     if(!coach){
        return res.status(404).json({
            success: false,
            message: "Coach with the email is not found.",
        });
     }
     coach.generatePasswordReset();
     await coach.save();
     //Sent the password reset link to the email
     let html = `
     <div>
     <h1>Hello, ${coach.email}</h1>
     <p>Please click the following link to reset your password.</p>
     <p>If this password reset not created by you then you can ignore this email.</p>
     <a href="${DOMAIN}coaches/reset-password-now/${coach.resetPasswordToken}">Reset Now</a>
    </div>
     `;
    await sendMail(coach.email, "Reset Password", "Please reset your password.", html);
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
 * @api/coaches/reset-password-now/:resetPasswordToken
 * @type GET
 */

router.get('/reset-password-now/:resetPasswordToken',  async(req, res)=>{
    try{
    let { resetPasswordToken } = req.params;
    let coach = await Coach.findOne({resetPasswordToken, resetPasswordExpiresIn: {$gt: Date.now()}, });
    if(!coach){
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
 * @api/coaches/api/reset-password-now
 * @type POST
 */

 router.post('/api/reset-password-now', async(req, res)=>{
     try{
    let { resetPasswordToken, password } = req.body;
        let coach = await Coach.findOne({resetPasswordToken, resetPasswordExpiresIn: {$gt: Date.now()}, });
        if(!coach){
            return res.status(401).json({
                success: false,
                message: "Password reset token is invalid or has expired.",
            });
        }
        coach.password = password;
        coach.resetPasswordToken = undefined;
        coach. resetPasswordExpiresIn = undefined;
        await coach.save();

         //Send confirmation of successful password change
     let html = `
     <div>
     <h1>Hello, ${coach.email}</h1>
     <p>Your password reset is successfully.</p>
     <p>If this reset is not done by you then you can contact us immediately.</p>
    
    </div>
     `;
    await sendMail(coach.email, "Reset Password Successful", "Your password is changed.", html);
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
