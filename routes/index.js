var express = require('express');
var router = express.Router();

var locals = {
        title: 		 'HeeYou',
        description: 'A site dedicated to HeeYou',
        author: 	 'Frank van der Stad',
        _layoutFile: true
};

/* GET home page. */
router.get('/', function(req, res, next) {
    locals.title = 'Express';
    locals.response = '';
    res.render('index', locals);
});

module.exports = router;
