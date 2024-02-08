// Filename - App.js

const express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    nodemailer = require("nodemailer"),
    randomstring = require("randomstring");

const User = require("./model/User");

let app = express();

mongoose.connect("mongodb://localhost/27017");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    require("express-session")({
        secret: "Rusty is a dog",
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
   user: 'your_gmail@gmail.com',
   pass: 'password',
  },
 });

// ROUTES

// Showing home page
app.get("/", function (req, res) {
    res.render("home");
});

// Showing secret page
app.get("/secret", isLoggedIn, function (req, res) {
    res.render("secret");
});

// Showing register form
app.get("/register", function (req, res) {
    res.render("register");
});

// Handling user signup
app.post("/register", async (req, res) => {
    const user = await User.create({
        username: req.body.username,
        password: req.body.password,
    });

    return res.status(200).json(user);
});

// Showing login form
app.get("/login", function (req, res) {
    res.render("login");
});

// Handling user login
app.post("/login", async function (req, res) {
    try {
        // check if the user exists
        const user = await User.findOne({ username: req.body.username });
        if (user) {
            // Send OTP to user's email
            const otp = randomstring.generate({ length: 6, charset: "numeric" });

            const mailOptions = {
                from: "your_gmail@gmail.com", // Replace with your email address
                to: user.username, // Assuming the username is the email
                subject: "Your OTP for Verification",
                text: `Your OTP is: ${otp}`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    res.status(500).send("Error sending OTP");
                } else {
                    console.log("Email sent: " + info.response);
                    res.render("otp", { username: user.username, otp: otp });
                }
            });
        } else {
            res.status(400).json({ error: "User doesn't exist" });
        }
    } catch (error) {
        res.status(400).json({ error });
    }
});

// Handling user logout
app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}

let port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Has Started!");
});
