const jwt = require('jsonwebtoken');
const logger = require("../util/logger");
const { getJWTSecret} = require("../util/getJWTKey");
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-2' || process.eng.AWS_DEFAULT_REGION});

const authenticateJWT = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const JWT_SECRET_KEY = await getJWTSecret();
    if (!token) {
        logger.error("No token provided");
        return res.status(401).json({ message: 'No token provided.' });
    }

    jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
        if (err) {
            logger.error("Invalid token", err);
            return res.status(403).json({ message: 'Invalid token.' });
        }
        // console.log(user);
        req.user = user;
        next();
    });
};

module.exports = {authenticateJWT};