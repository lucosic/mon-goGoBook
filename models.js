var mongoose = require('mongoose');

mongoose.model('User', new mongoose.Schema({
    email: String,
    passwordHash: String
}));


mongoose.model('Book', new mongoose.Schema({
    _id: Object,
    title: String,
    authors: String,
    average_rating: Number,
    language: String,
    ratings_count: Number,
    publication_date: String,
    publisher: String
}));