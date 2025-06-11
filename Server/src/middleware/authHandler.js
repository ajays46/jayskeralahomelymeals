import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

export const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization.split(" ")?.[1]
    console.log(token, "token auth");


    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        console.log(decoded, "decoded");
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', expired: true });
        }
        return res.status(400).json({ error: 'Invalid token' });
    }

}