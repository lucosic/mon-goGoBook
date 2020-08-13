var express = require('express');
var router = express.Router();
//include .env
require('dotenv').config();

//mongoose is used to connect to the MongoDB
var mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true,  useUnifiedTopology: true});
require('../models');
var User = mongoose.model('User');
var Book = mongoose.model('Book');

//bcrypt is used to hash passwords
var bcrypt = require('bcrypt');

//Express Session
var expressSession = require('express-session');
router.use(expressSession({
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: true }
}));

//GET requests

router.get('/', function(req, res, next) {
  res.render('index', { title: '(Mon)goGoBook - a book recommendation system'});
});

router.get('/login', function (req, res, next) {
  res.render('login', { title: 'Log in', path: 'login', alternativePath: 'signup' });
});

router.get('/signup', function (req, res, next) {
  res.render('login', { title: 'Sign up', path: 'signup', alternativePath: 'login' });
});

router.get('/all-books', fetchPageContent(Book, ['TITLE', 'AUTHORS', 'AVERAGE_RATING', 'BOOK COVER']), function (req, res, next) {
  //res.json(res.pageContent);
  res.render('all-books', { title: 'All books', dataArray: res.pageContent })
});

router.get('/my-books', function (req, res, next) {
  res.render('my-books', { title: 'My books' })
});

router.get('/discover', function (req, res, next) {

  res.render('discover', { title: 'Discover' })
});

//POST requests

router.post('/login', function (req, res, next) {
  User.findOne({
    email: req.body.email
  }, function (err, user){
    if (err) return next(err);
    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) return next ({message: "Login succeeded!"});
    else return next ({message: "Login failed!"})
  });
  console.log(req.body);
});

router.post('/signup', function (req, res, next) {
  User.findOne({
    email: req.body.email
  }, function (err, user){
    if (err) return next(err);
    if (user) return next ({message: "User already exists!"});
    let newUser = new User({
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10)
    });
    newUser.save();
  });
  console.log(req.body);
  return next ({message: "User saved!"});
});

//Additional functions

function fetchPageContent(mongooseModel, headerNames){
  return async function (req, res, next){
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    if (isNaN(page)) page = 1;
    if (isNaN(limit)) limit = 15;
    let startIndex = (page-1) * limit;
    let endIndex = page * limit;
    let numberOfDocuments = parseInt(await mongooseModel.countDocuments().exec());

    let pageContent = {};

    pageContent.dataInfo = {
      page: page,
      limit: limit,
      startIndex: startIndex,
      endIndex: endIndex,
      numberOfDocuments: numberOfDocuments,
      headerNames: headerNames
    };

    if (endIndex < numberOfDocuments) {
      pageContent.next = {
        page: page + 1,
        limit: limit
      }
    }
    if (startIndex > 0) {
      pageContent.previous = {
        page: page - 1,
        limit: limit
      }
    }
    try {
      pageContent.results = await Book.find().limit(limit).skip(startIndex).exec();
      res.pageContent = pageContent;
      next();
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
}

module.exports = router;
