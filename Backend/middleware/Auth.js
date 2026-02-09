import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
    try {
        const isAuth = req.headers['x-user-token'];
        if (!isAuth) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access"
            })
        }

        const decoded = jwt.verify(isAuth, process.env.JWT_SECRET);
        req.user = decoded;
        next();






    }
    catch (error) {
        console.log("Error in authenticating token", error);
        res.status(401).json({ success: false, message: "Unauthorized access" });
    }
}