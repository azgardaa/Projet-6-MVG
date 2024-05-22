const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
require("dotenv").config();

const motsDePasseInterdits = process.env.MOTS_DE_PASSE_INTERDITS.split(",");

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      },
      message: "Email is invalid",
    },
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return !motsDePasseInterdits.includes(value);
      },
      message: "Password is not allowed",
    },
  },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
