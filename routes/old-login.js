var express = require('express');
var router = express.Router();

//mongoose is used to connect to the MongoDB
var mongoose = require('mongoose');
//bcrypt is used to hash passwords
var bcrypt = require('bcrypt');

//models contains a data model of a user and a book
require('../models');
var User = mongoose.model('User');


//Express Session
const expressSession = require('express-session');
router.use(expressSession({
  secret: "gasjdjlajdohjaaerpojkjsdiafinhfgaf65645das324!",
  resave: true,
  saveUninitialized: true,
  cookie: { secure: true }
}));


router.get('/login', function (req, res, next) {
  res.render('login', { title: 'Log in', path: 'login', alternativePath: 'signup' });
});

router.get('/signup', function (req, res, next) {
  res.render('login', { title: 'Sign up', path: 'signup', alternativePath: 'login' });
});

router.post('/login', function (req, res, next) {
  let User = mongoose.model('User');
  User.findOne({
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10)
  }, function (err, user){
    if (err) return next(err);
    if (user) return next ({message: "Login sucess!"});
    else return next ({message: "Login FAIL!"})
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
});

/*

//Passport
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
router.use(passport.initialize());
router.use(passport.session());
passport.use(new LocalStrategy({
  usernameField: "email",
  passwordField: "password"
}, function (email, password, next) {
  User.findOne()({
    email:email
  }, function (err, user) {
    if (err) return next(err);
    if(!user | !bcrypt.compareSync(password, user.passwordHash)){
      return next({message: 'Email or password incorrect'})
    }
    next(null, user);
  })
}));

passport.serializeUser(function (user, next) {

})

passport.deserializeUser(function (id, next) {

})

*/




/*
router.post('/',
    passport.authenticate('local', { failureRedirect: '/' }),
    function(req, res) {
      res.redirect('../browse');
    });
*/
module.exports = router;
