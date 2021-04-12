import { config } from "dotenv";


config();

export const DOMAIN = process.env.APP_DOMAIN; //Change to edventures.ai
export const DB = process.env.APP_DB_CONNECT;
export const SENDGRID_API = process.env.APP_SENDGRID_API;
export const HOST_EMAIL = process.env.APP_HOST_EMAIL;
export const PORT = process.env.PORT || process.env.APP_PORT; //Uses production port or env port
export const SECRET = process.env.APP_SECRET;