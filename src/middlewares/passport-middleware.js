import passport from "passport";
import { Admin } from "../models";
import { Strategy, ExtractJwt } from "passport-jwt";
import { SECRET as secretOrKey} from "../constants";


const opts = {
    secretOrKey,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

passport.use(
    new Strategy(opts, async({ id }, done) =>{
        try{
         let admin = await Admin.findById(id);
         if (!admin){
             throw new Error("Admin not found.")
         }
         return done(null, admin.getAdminInfo());
        }catch(err){
          done(null, false);
        }
    })
)