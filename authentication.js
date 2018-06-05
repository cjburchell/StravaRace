class Authentication {

apiAuthenticationMiddleware() {
    return (req, res, next) => {

        var token;
        if (req.query !== undefined && req.query.token !== undefined) {
            token = req.query.token;
        }
        else if (req.body !== undefined && req.body.token !== undefined) {
            token = req.body.token;
        }
        else {
            res.status(403).send("Missing Token");
            return;
        }

        jwt.verify(token, akimboSecret, function (err, decoded) {
            if (err) {
                res.status(403).send("Invalid Token");
            }
            else {
                next();
            }
        });
    }
}

module.exports = new Authentication();