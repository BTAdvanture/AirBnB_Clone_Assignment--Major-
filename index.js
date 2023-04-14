require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const cookieParser = require('cookie-parser');//for readig cookies from browser
const { MongoClient } = require('mongodb');//for fetching data from MongoDB api
const bodyParser = require('body-parser');//for reading form data
const PORT = process.env.PORT || 4000;
require('./src/db/connection');//user and admin database connection
const Register = require('./src/models/register');
const RegisterAdmin = require('./src/models/adminreg');
const homeHost = require('./src/models/homeHost');
const bcrypt = require('bcryptjs');//for hashing password
const mongoose = require('mongoose');//for sending data of user admin and home hosting
const jwt = require('jsonwebtoken');
const auth = require('./src/middleware/auth'); // for user authentication
const hostAuth = require('./src/middleware/hostauth');//for host authentication
const session = require("express-session");
const flash = require('connect-flash');//for success err messages
const Razorpay = require('razorpay');//for payment 
let order_id_token;


// created in stance of rozorpay for payment confirmaiton
const razorpay = new Razorpay({
    key_id: process.env.KEY_ID,                
    key_secret: process.env.KEY_SECRET

})
app.post('/order', (req, res) => {
    let options = {
        amount: 500 * 100,
        currency: "INR",
    };
    razorpay.orders.create(options, (err, order) => {
        order_id_token = order.id
        console.log(order);
        res.json(order);
    })
});


// payment success route
app.get('/paymentsuccess', (req, res) => {
    res.render('paymentsuccess');
});
// after payment success this route is executed
app.post('/is-order-complete', (req, res) => {
    res.redirect("/paymentsuccess");

})

app.use(session({//session middleware set here
    secret: "nodejs",
    resave: true,
    saveUninitialized: true
}));

// app.post('/booking', auth, (req, res) => {
//     if (auth) {
//         res.redirect("/order")
//         req.flash("error", "Login First");
//     }
//     else {
//         res.redirect("/"); 
//     }


// })


app.use(flash());//flash message set here
app.use(express.static('public')); //for using external css file and images
app.use(cookieParser());//for reading form data 
app.set('view engine', 'ejs');//set our view engine to ejs
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, "/templates/views"));//views path set here
app.use((req, res, next) => {
    res.locals.success = req.flash('success');//for success message
    res.locals.error = req.flash('error');//for error message
    res.locals.alert = req.flash('alert');//for alert message
    next();
});


// Databse code access code from mongodbatlas

async function FindData() {//getting data from mongoatlas airbnb sample data
    const uri = process.env.SECCRET_KEY;
    const client = new MongoClient(uri);
    await client.connect();
    var result = await client.db("AirBnB").collection("airbnbapis").find().toArray();
    // console.log(result);
    return result;
}

// This function is for details page
async function fetchdataofproduct(name) { //this function is for product details
    const uri = process.env.SECCRET_KEY;
    const client = new MongoClient(uri);
    await client.connect();
    var result = await client.db("AirBnB").collection("airbnbapis").findOne({ name });
    // console.log("fetching data"+result);
    return result
}

// This is our home route all deta of airbnb send using FindData function 
app.get('/', async (req, res) => {
    let details = req.cookies.jwt;
    let data = await FindData()
    res.render('index', {
        data: data,
        details: details
    });
});

// login route
app.get('/login', (req, res) => {
    res.render('login');
});

// second page of hotel info
app.get('/details', auth, (req, res) => {
    res.render('details');
});
// host route
app.get('/host', (req, res) => {
    res.render('host');
});
// This is for access page
app.get('/admin', async (req, res) => {
    let details = req.cookies.jwthost;
    res.render('admin', {
        details: details
    });
});

//for inserting property in our website 
app.get('/hosthome', async (req, res) => {
    res.render('hosthome');
});
// This is admin dashbord admin can perform crud
app.get('/dashbord', hostAuth, async (req, res) => {
    let data = await FindData()
    // console.log(data);
    res.render('dashbord', {
        data: data,
    });
});

// This is edit home route of prefilling user home info in edit form
app.get('/edithome/:id', async (req, res) => {
    let id = req.params.id;
    // console.log(id);
    homeHost.findById(id, (err, data) => {
        if (err) {
            res.redirect('/dashbord');
        } else {
            if (data === null) {
                redirect('/dashbord')
            } else {
                res.render('edithome', {
                    data: data
                })
            }
        }
    })

});



// Update property of user by finding his id this is (POST route)

app.post('/update/:id', (req, res) => {
    let id = req.params.id;
    // console.log(id);
    homeHost.findByIdAndUpdate(id, {
        name: req.body.propertyname,
        country: req.body.country,
        Price: req.body.Price,
        summery: req.body.summery,
        bedrooms: req.body.bedrooms,
        bed: req.body.bed,
        bathroom: req.body.bathrooms,
        images: req.body.image,
        address: req.body.address,
        cancellation_policy: req.body.policy,
    }, function (err, docs) {
        if (err) {
            console.log(err)
        } else {
            req.flash("success", "User Updated Sccessfully ");
            res.redirect("/dashbord");//redirect on dashbord
        }
    })


})

// Register method for  adding user 
app.post('/register', async (req, res) => {
    try {
        const password = req.body.password; // user entered password
        const Cpassword = req.body.cpassword;//confirm password for user
        if (password === Cpassword) {

            const registerEmployee = new Register({  // user data is stored here all info
                firstname: req.body.fname,
                lastname: req.body.lname,
                email: req.body.email,
                password: password,
                cpassword: Cpassword,
            })


            // const token = await registerEmployee.generateAuthToken();//this is token generated

            // console.log("js file " + token);

            // res.cookie("jwt", token, {
            //     expires: new Date(Date.now() + 300000),//creates cookie and stored in browser
            //     httpOnly: true
            // });

            const register = await registerEmployee.save();// for saving data on database
            // console.log(register);

            if (register != "") {
                req.flash("success", "User Registered Sccessfully Please Login to Continue With Us");
                res.redirect('/');//after database saved redirect homescreen
                console.log("success");
            }


        } else {
            req.flash("error", "Password not matching ");
            res.render('/');
            // res.send("Password is not matcing");//if password is not matcing this res shows
        }

    } catch (e) {
        req.flash("error", "Email Already Registered Please login");
        res.redirect('/');
        // console.log(e);
    }
});



// Product Details accessed using this function this is info page about house
app.get('/details/:name', async (req, res) => {
    // res.render(req.params.id);
    // console.log(req.params['id']+" finding");

    let data = await fetchdataofproduct(req.params.name)//this data contains unique id of house
    // console.log(data);
    res.render('details', {
        data: data
    });
});



// Login verification for user
app.post('/loginmethod', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        let user = await Register.findOne({ email: email });

        const isMatch = await bcrypt.compare(password, user.password); //this compares databse password with user entered password

        // once passoword is correct add token
        const token = await user.generateAuthToken();
        // console.log("login token"+token);

        // user entered and db psw
        if (isMatch) { // if it matches then it returns on homescreen
            res.cookie("jwt", token, {  //cookie added when uer is login
                expires: new Date(Date.now() + 3000000),
                httpOnly: true,
                // secure: true
            });

            req.flash("success", "Logged In successfully");
            res.redirect('/');
        } else {
            req.flash("error", "Password not matching ");
            res.redirect('/');
            // res.send("Password is not matcing");
        }
    } catch (e) {
        req.flash("error", "User  not Found ");
        res.redirect('/');
    }
});


// Admin signup method info accessed here when submitted
app.post('/adminSignup', async (req, res) => {
    try {
        const password = req.body.password; // user entered password
        const Cpassword = req.body.cpassword;//confirm password for user
        if (password === Cpassword) {

            const registerdetails = new RegisterAdmin({  // user data is stored here all info
                name: req.body.name,
                number: req.body.number,
                email: req.body.email,
                password: password,
                cpassword: Cpassword,
            })

            const admin = await registerdetails.save();// for saving data on database
            console.log(admin);


            if (admin != "") {
                res.redirect('/admin');//after database saved redirect homescreen
                console.log("success");
            }



        } else {
            res.send("Password is not matcing");//if password is not matcing this res shows
        }

    } catch (e) {
        res.send(e);
        // console.log(e);
    }

});


// This is for admin login related route it validates and sends to the hotel,home insersion page
app.post('/adminLogin', async (req, res) => {
    try {
        const email = req.body.adminemail;
        const password = req.body.adminpsw;
        console.log(email, password);
        let user = await RegisterAdmin.findOne({ email: email });

        const isMatch = await bcrypt.compare(password, user.password); //this compares 
        // console.log(isMatch); 

        const token = await user.generateAuthToken();

        // user entered and db psw
        if (isMatch) { // if it matches then it returns on homescreen
            res.cookie("jwthost", token, {  //cookie added when uer is login
                expires: new Date(Date.now() + 3000000),
                httpOnly: true,
                // secure: true
            });
            req.flash("success", "Hello Admin Whats Going On 🤔");
            res.redirect('/dashbord');

        }
        else {
            req.flash("error", "Password not matching ");
            res.redirect('/admin');
        }
    } catch (e) {
        req.flash("error", "Admin Not found");
        res.redirect('/admin');
    }
});


// inserting home in database by host
app.post('/hosthome', async (req, res) => {
    try {

        const hostHome = new homeHost({  // user data is stored here all info
            name: req.body.propertyname,
            country: req.body.country,
            Price: req.body.prince,
            summery: req.body.summery,
            bedrooms: req.body.bedrooms,
            bed: req.body.bed,
            bathroom: req.body.bathrooms,
            images: req.body.image,
            address: req.body.address,
            cancellation_policy: req.body.policy,
        })
        const hosth = await hostHome.save();// for saving data on database
        req.flash("success", "Home Added  Sccessfully");//message is displayed after logout
        res.redirect("/dashbord");//redirect on home page
    }
    catch (e) {
        console.log("error message");
    }
});

// Edit Hosted home here

// app.post("/edithome/:name", (req, res) => {
//     let name = req.params.name;
//     console.log(name);


// })

// Delete Home Route for deleting hosted home from databse finding by his id
app.get("/delete/:id", (req, res) => {

    let id = req.params.id;
    homeHost.findByIdAndRemove(id, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            req.flash("error", "Deleted Sccessfully");
            res.redirect("/dashbord");
        }
    })
})

// for logout user and remove token
app.get('/logout', auth, async (req, res) => {
    req.user.tokens = [];
    res.clearCookie("jwt");//clear cookies after logout button clicked
    await req.user.save();
    req.flash("success", "Logged Out Sccessfully");//message is displayed after logout
    res.redirect("/");//redirect on home page
});

// Logout Admin  and remove token
app.get('/logoutAdmin', hostAuth, async (req, res) => {
    req.user.tokens = [];
    res.clearCookie("jwthost");//clear cookies after logout button clicked
    await req.user.save();
    req.flash("success", "Logged Out Sccessfully");//message is displayed after logout
    res.redirect("/admin");//redirect on home page
});


// for other pages that user want to access it shows 404 error
app.get('*', async (req, res) => {
    res.render('error');

});



app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`)); 