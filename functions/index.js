/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
const express = require("express");
const session = require("express-session");
const path = require("path");

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

const users = [
  {id: "1", name: "Vernon Roque", email: "vroque88@gmail.com", role: "admin"},
  {id: "2", name: "Jane Smith", email: "jane@example.com", role: "user"},
  {id: "3", name: "John Doe", email: "john@example.com", role: "user"},

  // Add more demo users as needed
];

// Middleware to check for admin role
function checkRole(role) {
  return function(req, res, next) {
    if (req.user && req.user.role === role) {
      next(); // User has the required role
    } else {
      res.status(403).send("Access denied: insufficient privileges");
    }
  };
}


app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));
app.use(express.static("protected"));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = users.find((user) => user.id === id); // Find the user in the in-memory array
  if (user) {
    done(null, user); // Pass the user object to req.user
  } else {
    done(new Error("User not found"));
  }
});

// Verify Token Route
app.post("/auth/google/callback", async (req, res) => {
  // console.log("I am in the verify token route");
  // Check if the Authorization header exists
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({error: "No token provided"});
  }

  // Extract the token (removing 'Bearer ' prefix)
  const token = authHeader.split(" ")[1];
  // console.log("This is the token>>>", token);

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    // console.log("This is the payload>>>", payload);
    const userId = payload.sub;
    const userEmail = payload.email;
    const userName = payload.name;

    // Assign role based on email (you could use a database for more complex logic)
    let role = "user"; // Default role
    if (userEmail === "vroque88@gmail.com") {
      role = "admin";
    }
    // Authenticate user using Passport
    req.login({id: userId, name: userName, email: userEmail, role}, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({message: "Login failed"});
      }
    });

    // Redirect based on the role
    if (role === "admin") {
      res.json({redirect: "/admin"}); // Redirect to /admin for admin users
    } else {
      res.json({redirect: "/welcome.html"}); // Redirect to /welcome for regular users
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

// Define the /admin route and protect it with the admin role
app.get("/admin", checkRole("admin"), (req, res) => {
  console.log("I am in the admin route");
  res.sendFile(path.join(__dirname, "protected", "classified.html")); // Serve the admin page
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
