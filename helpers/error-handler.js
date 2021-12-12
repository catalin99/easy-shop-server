function errorHandler(err, req, res, next) {
    if(err.name === 'UnauthorizedError') {
        //jwt auth error
        return res.status(401).json({message: "The user is not authorized"});
    }

    if(err.name === "ValidationError") {
        //validation error
        return res.status(401).json({message: err});
    }

    //default error
    return res.status(500).json({message: err});
}

module.exports = errorHandler;