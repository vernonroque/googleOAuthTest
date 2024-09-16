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

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// don't need GoogleStrategy because I have a custom route for login
// passport.use(new GoogleStrategy({

//   clientID: "YOUR_GOOGLE_CLIENT_ID",
//   clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
//   callbackURL: "/auth/google/callback",
// },

// ((accessToken, refreshToken, profile, done) => {
//   // Store the accessToken, refreshToken, and user profile on the server
//   // Set a 1-day expiration for the session
//   return done(null, {accessToken, refreshToken, profile});
// }),

// ));

// Verify Token Route
app.get("/auth/google/callback", async (req, res) => {
  const token = req.query.token;

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userId = payload.sub;
    const userEmail = payload.email;
    const userName = payload.name;

    // Authenticate user using Passport
    req.login({id: userId, name: userName, email: userEmail}, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({message: "Login failed"});
      }

      // Redirect to dashboard or another page after login
      res.redirect("/");
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(400).json({error: "Invalid token"});
  }
});

app.get("/", (req, res) => {
  console.log("Hello World");
  res.status(200).send({"message": " hello world "});
});

// app.get("/auth/google/callback",
//     passport.authenticate("google", {failureRedirect: "/"}),
//     (req, res) => {
//       res.redirect("/dashboard");
//     },
// );

// Checks session expiration on every request
app.use((req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }

  next();
});


// Listen command
exports.api = functions.https.onRequest(app);
