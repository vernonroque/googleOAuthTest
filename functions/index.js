const express = require("express");

const functions = require("firebase-functions");

const cors = require("cors");
require("dotenv").config();

// Instantiate the app here
const app = express();
app.use(cors());

// ** DO NOT INCLUDE THE LINE BELOW! IT WILL CAUSE AN ERROR WITH FIREBASE
// const PORT = process.env.PORT || 4001;

// app.listen(PORT, () => {
//   console.log(`Server is listening on port ${PORT}`);
// });

app.get("/", (req, res) => {
  console.log("Hello World");
  res.status(200).send({"message": " hello world "});
});

app.post("/exchange-code", async (req, res) => {
  const {code} = req.body;

  if (!code) {
    return res.status(400).send({error: "Authorization code missing"});
  }

  const tokenEndpoint = "https://oauth2.googleapis.com/token";

  try {
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: new URLSearchParams({
        code: code,
        // eslint-disable-next-line max-len
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: "https://oauthtest-df7af.web.app/oauth2callback",
        grant_type: "authorization_code",
      }),
    });

    const tokens = await response.json();

    if (tokens.error) {
      return res.status(400).send({error: tokens.error_description});
    }

    // Send the tokens back to the frontend (or handle them server-side)
    res.status(200).json(tokens);
  } catch (error) {
    console.error("Error exchanging authorization code:", error);
    res.status(500).send({error: "Failed to exchange authorization code"});
  }
});
// Listen command
exports.api = functions.https.onRequest(app);
