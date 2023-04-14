const jwt = require('jsonwebtoken');
const RegisterAdmin = require('../models/adminreg');


const hostauth = async (req, res, next) => { //This is middleware auth for user
    try {
        const token = req.cookies.jwthost; // requesting cookie from browser
        const verify = jwt.verify(token, process.env.SECUTIRY_KEY);
        // console.log(verify);

        const user =await RegisterAdmin.findOne({ _id: verify._id });
        req.user=user,
        req.token=token
        next();
    } catch (error) {
        req.flash("alert","Please Login First");
            res.redirect('/');
        // res.status(401).send("error");
    }
}

module.exports = hostauth;