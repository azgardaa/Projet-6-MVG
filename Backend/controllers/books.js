const Book = require("../models/books");
const sharp = require("sharp");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;

  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/image${
      req.file.filename
    }`,
  });

  if (req.file) {
    const imagePath = `images/${req.file.filename}`;
    const optimizedImagePath = `images/optimized-${req.file.filename}`;

    sharp(imagePath)
      .resize(400, 600)
      .toFile(optimizedImagePath, (err, info) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Mise à jour de l'image URL pour utiliser l'image optimisée
        book.imageUrl = `${req.protocol}://${req.get(
          "host"
        )}/images/optimized-${req.file.filename}`;

        // Sauvegarder le livre avec l'image optimisée
        book
          .save()
          .then(() => {
            // Supprimer l'image originale
            console.log(imagePath);
            fs.unlink(`${imagePath}`, (e) => {
              console.log(e);
              res.status(201).json({
                message:
                  "Livre enregistré avec succès avec l'image optimisée !",
              });
            });
          })

          .catch((error) => res.status(400).json({ error }));
      });
  } else {
    book
      .save()
      .then(() =>
        res.status(201).json({ message: "Livre enregistré avec succès !" })
      )
      .catch((error) => res.status(400).json({ error }));
  }
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({
    _id: req.params.id,
  })
    .then((book) => {
      res.status(200).json(book);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete bookObject._userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Livre modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};
exports.getBooksByBestRating = async (req, res, next) => {
  try {
    return await Book.find()
      .sort({ averageRating: -1 })
      .limit(3)
      .then((books) => res.status(200).json(books))
      .catch((error) => res.status(400).json({ error: error.message }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.rateBook = (req, res, next) => {
  const userId = req.auth.userId;
  const { grade } = req.body;

  if (grade < 1 || grade > 5) {
    return res
      .status(400)
      .json({ message: "La note doit être comprise entre 1 et 5." });
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé." });
      }

      // Vérifier si l'utilisateur a déjà noté le livre
      const existingRating = book.ratings.find((r) => r.userId === userId);
      if (existingRating) {
        return res
          .status(400)
          .json({ message: "Vous avez déjà noté ce livre." });
      }

      // Ajouter la nouvelle note
      book.ratings.push({ userId, grade });

      // Calculer la nouvelle moyenne des notes
      const totalRatings = book.ratings.length;
      const sumRatings = book.ratings.reduce((sum, r) => sum + r.grade, 0);
      book.averageRating = sumRatings / totalRatings;

      book
        .save()
        .then(() => res.status(201).json(book))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
