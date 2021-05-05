import { validationResult } from "express-validator";

//Custom middlewares to validate inputs
const Validator = (req, res, next) =>{
    let errors = validationResult(req);
    if(!errors.isEmpty()){
    return res.json({
        errors:errors.array()
    });
}
next();
};

export default Validator;
