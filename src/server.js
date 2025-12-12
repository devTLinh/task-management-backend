import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from 'cors';
import viewEngine from "./config/viewEngine.js";
// import initWebRoutes from "./route/web";
import expressEjsLayouts from "express-ejs-layouts";
import initRoutes from "./route/web.js";
import connectDB from "./config/connectDB.js";
import authMiddleware from './middlewares/client/authJwt.middleware.js';
import userController from './controllers/userController.js';
import path from 'path';
import { fileURLToPath } from 'url'; 
import * as dotenv from 'dotenv'; // THAY THẾ require('dotenv').config()
dotenv.config();
//console.log('JWT_SECRET value:', process.env.JWT_SECRET);
const __dirname = path.dirname(fileURLToPath(import.meta.url)); 
//require('dotenv').config();

let app = express();
// config app
viewEngine(app);
app.set("views", path.join(__dirname, "views")); // Trỏ đến src/views

//app.set('view cache', false);
// 1. CẤU HÌNH LAYOUT: Sử dụng middleware express-ejs-layouts
app.use(expressEjsLayouts); // <--- DÒNG BỔ SUNG 1

// 2. CẤU HÌNH LAYOUT: Đặt file layout mặc định là master.ejs
app.set('layout', 'layout/master'); // <--- DÒNG BỔ SUNG 2 (Đảm bảo đường dẫn đúng)

//console.log("Using layout:", app.get("layout"));
//console.log("Using view folder:", app.get("views"));
//console.log("Using public folder:", path.join(__dirname, 'public/assets'));
//console.log("EJS Layouts:", expressEjsLayouts);

app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
   extended: true
}));
app.use(cookieParser());
app.use(cors());

// Config router
//app.use(authMiddleware.requiredAuth)
app.use('/home', authMiddleware.requiredAuth);
//initWebRoutes(app);
initRoutes(app);

connectDB();

let port = process.env.PORT || 8080;

app.listen(port, () => {
   console.log("Backend is running on the port: " + port);
})