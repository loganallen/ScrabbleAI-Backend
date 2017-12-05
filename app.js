var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

var index = require('./routes/index');
var validateWords = require('./routes/validateWords');

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
app.use('/validateWords', validateWords);

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

// load word dictionaries
console.log('Generating word dictionaries...');
var wordsDict = {};
for (var i=2; i<13; i++) {
  try {
   var filename = `../data/${i}_letter_words.csv`;
   var words = fs.readFileSync(filename, 'utf8');
   var dict = {};
   words.split(',').forEach(word => {
    dict[word] = word;
   });
   wordsDict[i] = dict;
 } catch(e) {
  console.log('Error', e.stack);
 }
}
console.log('Finished');
app.set('dictionary', wordsDict);

module.exports = app;
