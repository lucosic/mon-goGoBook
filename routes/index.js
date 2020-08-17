var express = require('express');
var router = express.Router();

//include .env
  require('dotenv').config();
//mongoose is used to connect to the MongoDB
  const mongoose = require('mongoose');
  mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true,  useUnifiedTopology: true});
  require('../models');
  var userModel = mongoose.model('User');
  var bookModel = mongoose.model('Book');
  var tagModel = mongoose.model("Tag");
  var bookTagModel = mongoose.model("BookTag");
  var bookWithTagModel = mongoose.model("BookWithTag");
//bcrypt is used to hash passwords
  var bcrypt = require('bcrypt');
//passport
  var LocalStrategy = require('passport-local').Strategy;

// Passport login name="local" with local strategy
var passport = require('passport');
router.use(passport.initialize());
router.use(passport.session());
passport.use(new LocalStrategy({
  usernameField: "email",
  passwordField: "password"
}, function(email, password, next) {
  userModel.findOne({
    email: email
  }, function(err, user) {
    if (err) return next(err);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      console.log("Email or password incorrect");
      return next(null, false, { message: 'Incorrect password.' })
    }
    console.log("Login email&password are correct");
    next(null, user);
  })
}));
// Passport signup name="signup-local" with local strategy
passport.use('signup-local', new LocalStrategy({
  usernameField: "email",
  passwordField: "password"
}, function(email, password, next) {
  userModel.findOne({
    email: email
  }, function(err, user) {
    if (err) return next(err);
    if (user){
      console.log("User already exists");
      return next(null, false, { message: 'User already exists.' });
    }
    let newUser = new userModel({
      email: email,
      passwordHash: bcrypt.hashSync(password, 10)
    });
    console.log("Saving new user");
    newUser.save(function(err) {
      next(err, newUser);
    });
  });
}));

passport.serializeUser(function(user, next) {
  let username = user.email.match(/^([^@]*)@/)[1];
  next(null, new userModel({
    _id: user._id,
    userName: username
  }));
});

passport.deserializeUser(function(id, next) {
  userModel.findById(id, function(err, user) {
    let username = user.email.match(/^([^@]*)@/)[1];
    next(err, new userModel({
      _id: user._id,
      email: username
    }));
  });
});

//GET requests

router.get('/', function(req, res, next) {
  res.redirect('/main');
});

router.get('/main', function(req, res, next) {
  res.render('index', { title: '(Mon)goGoBook - a book recommendation system', req: req});
});

router.get('/login', function (req, res, next) {
  res.render('login', { title: 'Log in', path: 'login', alternativePath: 'signup' , req: req});
});

router.get('/signup', function (req, res, next) {
  res.render('login', { title: 'Sign up', path: 'signup', alternativePath: 'login' , req: req});
});

router.get('/book', function(req, res, next) {
  var id = req.query.id;
  bookModel.findOne({
    goodreads_book_id: id
  }, (err, bookToDisplay) => {
    if (err) return next(err);
    if (bookToDisplay) {
      //res.json(res.pageContent);
      fetchTagsFromBook(req, res, next, bookToDisplay);
      userModel.findById(req.user.id, (err, user) => {
        if (err) return next(err);
        if (user){
          let gumbAktivan = false;
          console.log(`Gumb aktivan 2: ${gumbAktivan}`);
          for (let i=0; i < user.books.length; i++){
            if (user.books[i].id === bookToDisplay.id){
              gumbAktivan = true;
              break;
            }
          }
          res.render('book', {title: bookToDisplay.title, bookData: bookToDisplay, tagDataArray: res.pageContent, req: req , gumbAktivan: gumbAktivan});
        }
      });
    }
    else return next ({message: "Book lookup failed! ID does not exist!"})
  });
});

router.get('/all-books', fetchTableContent(bookModel, ['TITLE', 'AUTHORS', 'AVERAGE_RATING', 'BOOK COVER']), function (req, res, next) {
  //res.json(res.pageContent);
  res.render('all-books', { title: 'All books', dataArray: res.pageContent , req: req})
});

router.get('/my-books', fetchTableContent(bookModel, ['TITLE', 'AUTHORS', 'AVERAGE_RATING', 'BOOK COVER'], true), function (req, res, next) {
  res.render('my-books', { title: 'My books' , dataArray: res.pageContent, req: req})
});

router.get('/discover', function (req, res, next) {

  res.render('discover', { title: 'Discover' , req: req})
});

router.get('/logout', function(req, res, next) {
  req.logout();
  console.log("LOGOUT");
  res.redirect('/main');
});

//POST requests

router.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/all-books');
    });

router.post('/signup',
    passport.authenticate('signup-local', { failureRedirect: '/signup' }),
    function(req, res) {
      res.redirect('/all-books');
    });

router.post('/book', fetchTableContent(bookModel, ['TITLE', 'AUTHORS', 'AVERAGE_RATING', 'BOOK COVER']), function (req, res, next) {
  res.render('all-books', { title: 'All books', dataArray: res.pageContent, req: req });
});

router.post('/add-to-list', addOrRemoveFromList(), function (req, res, next) {
  res.redirect(`/my-books`);
});

//Additional functions
/*
function checkIfBookBelongsToList(req, res, next, book) {
  userModel.findById(req.user.id, (err, user) => {
    if (err) return next(err);
    if (user){
      let gumbAktivan = false;
      console.log(`Gumb aktivan 2: ${gumbAktivan}`);
      for (let i=0; i < user.books.length; i++){
        if (user.books[i].id === book.id){
          gumbAktivan = true;
          break;
        }
      }
      console.log(`Gumb aktivan 3: ${gumbAktivan}`);

      res.pageContent.gumbAktivan = gumbAktivan;
    }
  });
}

 */

function addOrRemoveFromList() {
  return async function(req, res, next){
    let pageContent = {};
    try{
      if (req.isAuthenticated()){
        let user = await userModel.findById(req.user.id).exec();
        let book = await bookModel.findOne({goodreads_book_id: req.body.bookGoodId}).exec();
        book.tag = [];
        //myListState utječe na prikaz gumba - "add to list"
        pageContent.myListState = false;
        let bookArray = user.books;
        for (let i=0; i < bookArray.length; i++){
          if (book.id === bookArray[i].id){
            //izbacujemo knjigu s liste
            bookArray = bookArray.filter((el) => { return el.id !== book.id; });

            //myListState se prilagođava za uključen gumb za dodavanje
            pageContent.myListState = true;
            break;
          }
        }
        if (pageContent.myListState === false){ // spremi knjigu u listu
          bookArray.push(book);
        }
        //update usera - njegove liste knjiga
        let test = await userModel.updateOne(
            {email: user.email},
            {books: bookArray}
        );
      }

      res.pageContent = pageContent;
      next();
    }
    catch (err) {
      console.log("Neuspješno spremanje/brisanje knjige iz liste.");
      next(err);
      //res.status(500).json({ message: err.message })
    }
  }
}

function fetchTagsFromBook(req, res, next, book) {
  let tagArray = [];
  tagArray = book.tag;
  let pageContent = {}; // sadrži datainfo (numberOfDocuments) i results (tag_id, tag_name)
  pageContent.dataInfo = {
    numberOfDocuments: tagArray.length
  };
  pageContent.results = tagArray;
  res.pageContent = pageContent;
}

function fetchTableContent(mongooseModel, headerNames, userSearch){
  return async function (req, res, next){
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let tagId = parseInt(req.query.tag);
    let bookSearch = req.query.bookSearch;

    if (isNaN(page)) page = 1;
    if (isNaN(limit)) limit = 15;
    let startIndex = (page-1) * limit;
    let endIndex = page * limit;

    let numberOfDocuments; //= parseInt(await mongooseModel.countDocuments().exec());

    let pageContent = {};

    try {
      if (userSearch === true){
        let user = await userModel.findById(req.user.id).exec();
        console.log(`User: ${user.email}`);
        pageContent.results = user.books;
        numberOfDocuments = user.books.length;
      }
      else if (bookSearch !== undefined){ //pretraživanje prema nazivu
        //{title: new RegExp('^'+bookSearch+'$', "i")}
        console.log(`Book search: ${bookSearch}`);
        pageContent.results = await mongooseModel.find({title: new RegExp(bookSearch, "i")}).limit(limit).skip(startIndex).exec();
        //console.log(`Book title: ${pageContent.results.title}`);
        numberOfDocuments = parseInt(await mongooseModel.countDocuments({title: new RegExp(bookSearch, "i")}).exec());
      }
      else if (isNaN(tagId)){ // sve knjige
        pageContent.results = await mongooseModel.find().limit(limit).skip(startIndex).exec();
        numberOfDocuments = parseInt(await mongooseModel.countDocuments().exec());
      }
      else { // pretraživanje prema tag-u
        pageContent.results = await mongooseModel.find({
          'tag.tag_id': tagId
        }).limit(limit).skip(startIndex).exec();
        numberOfDocuments = parseInt(await mongooseModel.countDocuments({
          'tag.tag_id': tagId
        }).exec());

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

      if (bookSearch !== undefined){
        pageContent.bookSearchString = bookSearch;
      }

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
      next(err);
      //res.status(500).json({ message: err.message })
    }
  }
}

module.exports = router;
