import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';



const app=express();

// app.use(cors({
//     origin:process.env.CORS_ORIGIN || 'http://localhost:5173',
//     credentials:true
// }))
const allowedOrigin =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_ORIGIN
    : process.env.DEV_ORIGIN;

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));
app.use(express.json())
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))

app.use(cookieParser())




export {app}