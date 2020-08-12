var mongoose = require('mongoose');

mongoose.model('User', new mongoose.Schema({
    user_id: String,
    email: String,
    passwordHash: String
}));

mongoose.model('ToRead', new mongoose.Schema({
    user_id: String,
    book_id: String
}));

mongoose.model('Rating', new mongoose.Schema({
    book_id: String,
    user_id: String,
    rating: Number
}));

var tagSchema = new mongoose.Schema({
    tag_id: String,
    tag_name: String
})

mongoose.model('Tag', tagSchema);

var bookTagSchema = new mongoose.Schema({
    goodreads_book_id : String,
    tag_id: String,
    count: Number
});

mongoose.model('BookTag', bookTagSchema);

var bookSchema = new mongoose.Schema({
    id: String,
    book_id: String,
    goodreads_book_id: String,
    authors:  String,
    original_publication_year:  String,
    title:  String,
    average_rating:  String,
    image_url: String,
    small_image_url: String
});

mongoose.model('Book', bookSchema);
