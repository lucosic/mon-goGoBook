var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//mongoose is used to connect to the MongoDB
//var mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost:27017/recommendationsDB', { useNewUrlParser: true,  useUnifiedTopology: true});
//bcrypt is used to hash passwords
//var bcrypt = require('bcrypt');
//models contains a data model of a user and a book
//require('./models');

var indexRouter = require('./routes/index');

var app = express();
//mongoose is used to connect to the MongoDB
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true,  useUnifiedTopology: true});


//Express Session & connect-mongo
const expressSession = require('express-session');
const MongoStore = require('connect-mongo')(expressSession);
app.use(expressSession({
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  cookie: { secure: false },
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    //autoRemove: 'interval',
    //autoRemoveInterval: 10 // In minutes. Default
    ttl: 14 * 24 * 60 * 60 // = 14 days. Default
    //autoRemove: 'disabled'
  })
}));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

module.exports = app;
