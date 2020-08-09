//NOT IN USE


var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('browse', { });
});

module.exports = router;