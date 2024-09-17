const express = require("express");
const session = require("express-session");
const passport = require("passport");
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
const {OAuth2Client} = require("google-auth-library");
const functions = require("firebase-functions");

const cors = require("cors");
require("dotenv").config();

// Instantiate the app here
const app = express();
app.use(cors());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {maxAge: 24 * 60 * 60 * 1000}, // 1 day expiration in milliseconds
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Verify Token Route
app.post("/auth/google/callback", async (req, res) => {
  console.log("I am in the verify token route");
  // let officialEmail = "";
  // Check if the Authorization header exists
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({error: "No token provided"});
  }

  // Extract the token (removing 'Bearer ' prefix)
  const token = authHeader.split(" ")[1];
  console.log("This is the token>>>", token);

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("This is the payload>>>", payload);
    const userId = payload.sub;
    const userEmail = payload.email;
    const userName = payload.name;

    // officialEmail = userEmail;
    // Authenticate user using Passport
    req.login({id: userId, name: userName, email: userEmail}, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({message: "Login failed"});
      }
    });

    // put privleges section below

    // Define authorized emails
    const authorizedEmails = ["vroque88@gmail.com"];

    if (authorizedEmails.includes(userEmail)) {
      res.json({email: userEmail, redirect: "/vernon.html"});
    } else {
      res.json({email: userEmail, redirect: "/welcome.html"});
    }
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(400).json({error: "Invalid token"});
  }
  // res.status(201).json({email: officialEmail});
});

app.get("/", (req, res) => {
  console.log("Hello World");
  res.status(200).send({"message": " hello world "});
});

// Checks session expiration on every request
app.use((req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/index.html");
  }

  next();
});


// Listen command
exports.api = functions.https.onRequest(app);
