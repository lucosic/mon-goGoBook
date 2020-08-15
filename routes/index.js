var express = require('express');
var router = express.Router();
//include .env
require('dotenv').config();

//mongoose is used to connect to the MongoDB
var mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true,  useUnifiedTopology: true});
require('../models');
var userModel = mongoose.model('User');
var bookModel = mongoose.model('Book');
var tagModel = mongoose.model("Tag");
var bookTagModel = mongoose.model("BookTag");
var bookWithTagModel = mongoose.model("BookWithTag");


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

router.get('/book', fetchTableContent(bookWithTagModel), fetchTagsById(), function(req, res, next) {
  var id = req.query.id;
  bookModel.findOne({
    goodreads_book_id: id
  }, (err, bookToDisplay) => {
    if (err) return next(err);
    if (bookToDisplay) {
      //res.json(res.pageContent);
      res.render('book', { title: bookToDisplay.title, bookData: bookToDisplay, tagDataArray: res.pageContent });
    }
    else return next ({message: "Book lookup failed! ID does not exist!"})
  });

});

router.get('/all-books', fetchTableContent(bookModel, ['TITLE', 'AUTHORS', 'AVERAGE_RATING', 'BOOK COVER']), function (req, res, next) {
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
  userModel.findOne({
    email: req.body.email
  }, function (err, user){
    if (err) return next(err);
    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) return next ({message: "Login succeeded!"});
    else return next ({message: "Login failed!"})
  });
  console.log(req.body);
});

router.post('/signup', function (req, res, next) {
  userModel.findOne({
    email: req.body.email
  }, function (err, user){
    if (err) return next(err);
    if (user) return next ({message: "User already exists!"});
    let newUser = new userModel({
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10)
    });
    newUser.save();
  });
  console.log(req.body);
  return next ({message: "User saved!"});
});

//Additional functions

function fetchTagsById(){
  return async function (req, res, next){
    let goodReadsId = req.query.id;
    let pageContent = {};
    let tagArray = [];
    console.log(`Fetching tags by ID... ${goodReadsId}`);
    try {
      let listBookTag = await bookTagModel.find({goodreads_book_id: goodReadsId}).exec();
      //let newTag;
      pageContent.dataInfo = {
        numberOfDocuments: listBookTag.length
      };
      if (listBookTag.length > 0){
        listBookTag.forEach(function (currentBookTag) {
          //newTag = tagModel.findOne({tag_id: currentBookTag.tag_id}).exec();
          tagModel.findOne(
              {
                tag_id: currentBookTag.tag_id
              }, function (err, newTag) {
                if (err) return next(err);
                if (newTag){
                  tagArray.push(new tagModel({
                    tag_id: newTag.tag_id,
                    tag_name: newTag.tag_name
                  }));
                }
          });
        });
        pageContent.results = tagArray;
      }
      res.pageContent = pageContent;
      next();
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
}

function fetchTableContent(mongooseModel, headerNames){
  return async function (req, res, next){
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let tagId = parseInt(req.query.tag);

    if (isNaN(page)) page = 1;
    if (isNaN(limit)) limit = 15;
    let startIndex = (page-1) * limit;
    let endIndex = page * limit;

    let numberOfDocuments; //= parseInt(await mongooseModel.countDocuments().exec());


    let pageContent = {};

    try {
      if (isNaN(tagId)){ // isključeno pretraživanje prema tag-u
        pageContent.results = await mongooseModel.find().limit(limit).skip(startIndex).exec();
        numberOfDocuments = parseInt(await mongooseModel.countDocuments().exec());
      }
      else { // uključeno pretraživanje prema tag-u
        pageContent.results = await bookWithTagModel.find({
          'tag.tag_id': tagId
        }).limit(limit).skip(startIndex).exec();
        numberOfDocuments = (await bookWithTagModel.find({
          'tag.tag_id': tagId
        }).exec()).length;

        let searchedTag = await tagModel.findOne({tag_id: tagId}).exec();
        pageContent.tagInfo = {
          tag_id: searchedTag.tag_id,
          tag_name: searchedTag.tag_name
        };
        console.log(`Page content ${pageContent.tagInfo.tag_name}`);
      }

      pageContent.dataInfo = {
        page: page,
        limit: limit,
        startIndex: startIndex,
        endIndex: endIndex,
        numberOfDocuments: numberOfDocuments,
        headerNames: headerNames,
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

      res.pageContent = pageContent;
      next();
    } catch (err) {
      console.log("Neuspješno preuzimanje knjiga");
      res.status(500).json({ message: err.message })
    }
  }
}

module.exports = router;
