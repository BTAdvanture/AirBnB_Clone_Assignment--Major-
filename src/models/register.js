const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const employeeSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("email is invalid")
            }
        }
    },
    password: {
        type: String,
        required: true,
    },
    cpassword: {
        type: String,
        required: true,
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]

});


//generating tokens
employeeSchema.methods.generateAuthToken = async function () {
    try {
        // console.log(this._id);
        const token = jwt.sign({ _id: this._id.toString() }, process.env.SECUTIRY_KEY);
        // console.log(token);
        this.tokens = this.tokens.concat({ token: token });
        await this.save();
        // console.log(token);
        return token;
    } catch (e) {
        res.send("the error part" + e)
        console.log(e);
    }
}

// before saving data 


// converting password to hash
employeeSchema.pre("save", async function (next) {

    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);// This is bycripted password
        this.cpassword = await bcrypt.hash(this.password, 10); // This passord is not saved to the database
    }

    next(); // after completed process goes to next step for saving details
})

// we need to create a collection

const Register = new mongoose.model("userdetails", employeeSchema);

module.exports = Register;