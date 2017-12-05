var express = require('express');

const validateWords = (dictionary, words) => {
  let valid = true;
  let invalidWords = [];

  words.forEach(word => {
    word = word.toLowerCase();
    let v = dictionary[word.length][word];
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
  // res.send('respond with a resource');
  let words = req.body.words;
  console.log('Validating words', words);
  let dictionary = req.app.get('dictionary');

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
