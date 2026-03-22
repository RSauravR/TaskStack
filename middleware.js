const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    const token = req.headers.token;
    if(!token) {
        res.status(403).json({
            message: "You have not logged in"
        });
        return;
    }
    const decode = jwt.verify(token, "sauravraman")
    const userId = decode.userId;
    if(!userId) {
        res.status(403).json({
            message: "malformed token"
        });
        return;
    }
    req.userId = userId;
    next();
}

module.exports = {
    authMiddleware: authMiddleware
};