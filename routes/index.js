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

router.get('/book', fetchTableContent(bookModel), function(req, res, next) {
  var id = req.query.id;
  bookModel.findOne({
    goodreads_book_id: id
  }, (err, bookToDisplay) => {
    if (err) return next(err);
    if (bookToDisplay) {
      //res.json(res.pageContent);
      fetchTagsFromBook(req, res, next, bookToDisplay);
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
  }, (err, user) =>{
    if (err) return next(err);
    if (user) return next ({message: "User already exists!"});
    let newUser = new userModel({
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10)
    });
    newUser.save();
    return next ({message: "User saved!"});
  });
  console.log(req.body);
});

router.post('/book', fetchTableContent(bookModel, ['TITLE', 'AUTHORS', 'AVERAGE_RATING', 'BOOK COVER']), function (req, res, next) {
  res.render('all-books', { title: 'All books', dataArray: res.pageContent });
});

//Additional functions

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

function fetchTableContent(mongooseModel, headerNames){
  return async function (req, res, next){
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let tagId = parseInt(req.query.tag);
    let bookSearch = req.body.bookSearch;

    if (isNaN(page)) page = 1;
    if (isNaN(limit)) limit = 15;
    let startIndex = (page-1) * limit;
    let endIndex = page * limit;

    let numberOfDocuments; //= parseInt(await mongooseModel.countDocuments().exec());

    let pageContent = {};

    try {
      if (bookSearch !== undefined){ //pretraživanje prema nazivu
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


router.get('/fix-db-model-now', fixDbModel(), function(req, res, next) {
  res.render('index', { title: '(Mon)goGoBook - a book recommendation system'});
});

function fixDbModel(){
  return async function (req, res, next) {
    console.log("It begins!");
    let content = {};
    let startIndex = 0;
    let endIndex = 9759;
    let counter = 0;
    let percentage;

    try {
      content.tagModel = await tagModel.find().exec();
      console.log("Preuzeo podatke oznaka.");
    } catch (err) {
      console.log("GREŠKA! Nisam preuzeo podatke oznaka.");
      res.status(500).json({message: err.message})
    }
    for(let boli = 0; boli < 100; boli++) {
      try {
        content.bookWithTagModel = await bookWithTagModel.find().limit(100).skip(boli*100).exec();
        console.log("Preuzeo podatke knjiga s oznakama.");
      } catch (err) {
        console.log("GREŠKA! Nisam preuzeo podatke knjiga s oznakama.");
        res.status(500).json({message: err.message})
      }

      let listOfBooks = [];
      let listOfTags = [];

      //prođi sve knjige
      for (let i = 0; i < content.bookWithTagModel.length; i++) {
        let bookWithTag = content.bookWithTagModel[i];
        listOfTags = [];
        //prođi sve tagove određene knjige
        for (let j = 0; j < bookWithTag.tag.length; j++) {
          let bookWithTagTag = bookWithTag.tag[j];
          //prođi sve tagove
          for (let z = 0; z < content.tagModel.length; z++) {
            let tag = content.tagModel[z];
            //usporedi id tagova
            if (bookWithTagTag.tag_id === tag.tag_id) {
              listOfTags.push(new tagModel({
                tag_id: tag.tag_id,
                tag_name: tag.tag_name
              }));
              break;
            }//usporedi id tagova
          }//prođi sve tagove
        }//prođi sve tagove određene knjige
        //dodaj knjigu
        if (listOfTags.length > 0) {
          listOfBooks.push(new bookWithTagModel({
            id: bookWithTag.id,
            book_id: bookWithTag.book_id,
            goodreads_book_id: bookWithTag.goodreads_book_id,
            authors: bookWithTag.authors,
            original_publication_year: bookWithTag.original_publication_year,
            title: bookWithTag.title,
            average_rating: bookWithTag.average_rating,
            image_url: bookWithTag.image_url,
            small_image_url: bookWithTag.small_image_url,
            tag: listOfTags
          }));
          counter++;
          percentage = (counter / (endIndex - startIndex) * 100).toFixed(2);
          console.log(`${percentage}% Saving book #${counter} Name: ${bookWithTag.title}`);
        }
      }//prođi sve knjige

      //insert svih knjiga
      console.log("Insering many...");
      if (listOfBooks.length > 0) {
        bookModel.insertMany(listOfBooks, function (err, docs) {
          if (err) return next(err);
          else if (docs) return ({message: "Uspjeh"});
        });
        console.log("Done inserting many!");
      }
      console.log(`!----SAVED-${boli}/100%----!`);
      next();
    }//Do tu boli
    console.log("DONEDONEDONE");
  }
}



module.exports = router;
