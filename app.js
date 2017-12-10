var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

var index = require('./routes/index');
var validateWords = require('./routes/validateWords');
var findBestWord = require('./routes/findBestWord');
var analyzeBoardConfiguration = require('./routes/analyzeBoardConfiguration');
var validateTilePlacement = require('./routes/validateTilePlacement');
var utils = require('./utils');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/validateWords', validateWords.router);
app.use('/findBestWord', findBestWord.router);
app.use('/validateTilePlacement', validateTilePlacement.router);
app.use('/analyzeBoardConfiguration', analyzeBoardConfiguration.router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Load all of the word dictionaries
console.log('Generating word dictionaries...');
var begDict = {};
try {
  let filename = '../data/beginner_words.csv';
  let words = fs.readFileSync(filename, 'utf8');
  words.split(',').forEach(word => { begDict[word] = word; });
} catch(e) {
 console.log('Error loading beginner dictionary', e.stack);
}

var interDict = {};
try {
  let filename = '../data/intermediate_words.csv';
  let words = fs.readFileSync(filename, 'utf8');
  words.split(',').forEach(word => { interDict[word] = word; });
} catch(e) {
 console.log('Error loading intermediate dictionary', e.stack);
}

var expertDict = {};
for (var i=2; i<13; i++) {
  try {
   let filename = `../data/${i}_letter_words.csv`;
   let words = fs.readFileSync(filename, 'utf8');
   words.split(',').forEach(word => { expertDict[word] = word; });
 } catch(e) {
  console.log('Error loading expert dictionary', e.stack);
 }
}

console.log(Object.keys(begDict).length);
console.log(Object.keys(interDict).length);
console.log(Object.keys(expertDict).length);

console.log('DONE: Finished loading dictionaries');
app.set('dictionary', {
  [utils.DictionaryLevel.BEGINNER]: begDict,
  [utils.DictionaryLevel.INTERMEDIATE]: interDict,
  [utils.DictionaryLevel.EXPERT]: expertDict
});

module.exports = app;
