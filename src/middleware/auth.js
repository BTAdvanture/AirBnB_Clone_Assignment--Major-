const jwt = require('jsonwebtoken');
const Register = require('../models/register');


const auth = async (req, res, next) => { //This is middleware auth for user
    try {
        const token = req.cookies.jwt; // requesting cookie from browser
        const verify = jwt.verify(token, process.env.SECUTIRY_KEY);
        // console.log(verify);

        const user = await Register.findOne({ _id: verify._id });
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        req.flash("alert", "Please Login First");
        res.redirect('/');
        // res.status(401).send("error");
    }
}

module.exports = auth;