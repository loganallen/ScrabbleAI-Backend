var express = require('express');
var router = express.Router();

/* POST validate words played on board. */
router.post('/', function(req, res, next) {
  // res.send('respond with a resource');
  console.log('Validating words', req.body.words);
  var dictionary = req.app.get('dictionary');
  let valid = true;
  let invalidWords = [];

  req.body.words.forEach(word => {
    word = word.toLowerCase();
    let v = dictionary[word.length][word];
    if (!v) {
      valid = false;
      invalidWords.push(word);
    }
  });

  res.json({
    valid: valid,
    invalidWords: invalidWords
  });
});

module.exports = router;
