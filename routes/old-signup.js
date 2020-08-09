var express = require('express');
var router = express.Router();

//mongoose is used to connect to the MongoDB
var mongoose = require('mongoose');
//bcrypt is used to hash passwords
var bcrypt = require('bcrypt');
//models contains a data model of a user and a book
require('../models');

var User = mongoose.model('User');

router.get('/', function (req, res, next) {
  res.render('login', { title: 'Sign up', path: 'signup', alternativePath: 'login' });
});

router.post('/', function (req, res, next) {
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

module.exports = router;
