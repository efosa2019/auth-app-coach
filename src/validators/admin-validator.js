import { check } from "express-validator";


const name = check("name", "Name is required.").not().isEmpty();
const email = check("email", "Please provide a valid email address.").isEmail();
const password = check("password", "Password is required of minimum length of 8.").isLength({ min: 8, });
const confirmPassword = check('confirmPassword', 'Passwords do not match').custom((value, {req}) => (value === req.body.password));


export const SignUpValidations = [name, email, password, confirmPassword];
export const AuthenticateValidations = [email, password];