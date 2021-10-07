import passport from "passport";
import { Coach } from "../models";
import { Strategy, ExtractJwt } from "passport-jwt";
import { SECRET as secretOrKey} from "../constants";


const opts = {
    secretOrKey,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

passport.use(
    new Strategy(opts, async({ id }, done) =>{
        try{
         let coach = await Coach.findById(id);
         if (!coach){
             throw new Error("Coach not found.")
         }
         return done(null, coach.getCoachInfo());
        }catch(err){
          done(null, false);
        }
    })
)

