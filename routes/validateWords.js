var express = require('express');

const validateWords = (dictionary, words) => {
  let valid = true;
  let invalidWords = [];

  words.forEach(word => {
    if (word.length > 12) {
      valid = false;
      invalidWords.push(word);
      return;
    }
    word = word.toLowerCase();
    let v = dictionary[word];
    if (!v) {
      valid = false;
      invalidWords.push(word);
    }
  });

  return [valid, invalidWords];
}

var router = express.Router();

/* POST validate words played on board. */
router.post('/', function(req, res, next) {
  let words = req.body.words;
  console.log('Validating words', words);
  let dictionary = req.app.get('dictionary')['EXPERT'];

  let [valid, invalidWords] = validateWords(dictionary, words);

  res.json({
    valid: valid,
    invalidWords: invalidWords
  });
});

module.exports = {
  router,
  validateWords
};
