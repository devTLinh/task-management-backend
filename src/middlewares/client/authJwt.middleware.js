import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const authMiddleware = {
    requiredAuth: (req, res, next) => {
        const token = req.cookies?.token;
        if (!token) return res.redirect('/login');

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return res.redirect('/login');
            req.user = decoded;
            next();
        });
    }
};

export default authMiddleware;
