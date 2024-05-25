const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const validator = require("validator");
require("dotenv").config();

exports.signup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Adresse email invalide." });
  }

  if (
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    return res
      .status(400)
      .json({ message: "Le mot de passe n'est pas assez fort." });
  }

  bcrypt
    .hash(password, 10)
    .then((hash) => {
      const user = new User({
        email: validator.normalizeEmail(email), // Sanitiser l'email
        password: hash,
      });
      user
        .save()
        .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email: validator.normalizeEmail(email) })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non trouvé !" });
      }
      bcrypt
        .compare(password, user.password)
        .then((valid) => {
          if (!valid) {
            return res.status(401).json({ error: "Mot de passe incorrect !" });
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
              expiresIn: "24h",
            }),
          });
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
