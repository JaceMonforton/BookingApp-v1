const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
    try {
        const token = req.headers["authorization"] && req.headers["authorization"].split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token not provided",
                success: false,
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    message: "Invalid token", /* This error is prominent, only fix is to reload the frontend? */
                    success: false,
                });
            } else {
                req.body.userId = decoded.id;
                next();
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};
