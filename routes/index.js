var express = require('express');
var router = express.Router();
//include .env
require('dotenv').config();
//mongoose is used to connect to the MongoDB
var mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true,  useUnifiedTopology: true});

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

var User = mongoose.model('User');
var Book = mongoose.model('Book-import');

router.get('/', function(req, res, next) {
  res.render('index', { title: '(Mon)goGoBook - a book recommendation system'});
});

router.get('/login', function (req, res, next) {
  res.render('login', { title: 'Log in', path: 'login', alternativePath: 'signup' });
});

router.get('/signup', function (req, res, next) {
  res.render('login', { title: 'Sign up', path: 'signup', alternativePath: 'login' });
});

router.get('/all-books', function (req, res, next) {
  res.render('all-books', { title: 'All books', content: content })
});

router.get('/my-books', function (req, res, next) {
  res.render('my-books', { title: 'My books' })
});

router.get('/discover', function (req, res, next) {
  res.render('discover', { title: 'Discover' })
});



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

module.exports = router;
