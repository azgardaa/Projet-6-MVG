const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
// .env // .env.prod // .env.dev ${process.env.MYVARIABLE}
const app = express();
const userRoutes = require("./routes/user");
const booksRoutes = require("./routes/books");

mongoose
  .connect(
    "mongodb+srv://Noah:Z9twUc36Zx36HFJp@databasemvg.ro9phdq.mongodb.net/?retryWrites=true&w=majority&appName=DatabaseMVG",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api/auth", userRoutes);
app.use("/api/books", booksRoutes);

module.exports = app;
