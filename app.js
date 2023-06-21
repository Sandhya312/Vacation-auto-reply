const express = require("express");
const { google } = require("googleapis");
const { authenticate } = require("@google-cloud/local-auth");
const port = 5000;
const path = require("path");
const fs = require("fs").promises;

const emailController = require('./controller/emailController')


const app = express();

app.get("/", emailController);

app.listen(port, () => {
  console.log(`server is running ${port}`);
});
