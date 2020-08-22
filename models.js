var mongoose = require('mongoose');

var toReadSchema = new mongoose.Schema({
    user_id: Number,
    book_id: Number
});

var ratingSchema = new mongoose.Schema({
    book_id: Number,
    user_id: Number,
    rating: Number
});

var tagSchema = new mongoose.Schema({
    tag_id: Number,
    tag_name: String
});


var bookTagSchema = new mongoose.Schema({
    goodreads_book_id : Number,
    tag_id: Number,
    count: Number
});

var bookSchema = new mongoose.Schema({
    id: Number,
    book_id: Number,
    goodreads_book_id: Number,
    authors:  String,
    original_publication_year:  Number,
    title:  String,
    average_rating:  Number,
    image_url: String,
    small_image_url: String,
    tag: [tagSchema]
});

var userSchema = new mongoose.Schema({
    user_id: Number,
    email: String,
    passwordHash: String,
    to_read: [bookSchema]
});

var bookWithTagSchema = new mongoose.Schema({
    id: Number,
    book_id: Number,
    goodreads_book_id: Number,
    authors:  String,
    original_publication_year:  Number,
    title:  String,
    average_rating:  Number,
    image_url: String,
    small_image_url: String,
    tag: [tagSchema]
});

mongoose.model('User', userSchema);
mongoose.model('ToRead', toReadSchema);
mongoose.model('Rating', ratingSchema);
mongoose.model('Tag', tagSchema);
mongoose.model('BookTag', bookTagSchema);
mongoose.model('Book', bookSchema);
mongoose.model("BookWithTag", bookWithTagSchema);