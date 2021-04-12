import { check } from "express-validator";


const name = check("name", "Name is required.").not().isEmpty();
const email = check("email", "Please provide a valid email address.").isEmail();
const password = check("password", "Password is required of minimum length of 8.").not().isLength({ min: 8, });

export const SignUpValidations = [name, email, password];
export const Authentications = [email, password];