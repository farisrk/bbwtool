var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/start', function(req, res, next) {
  res.render('layout');
});
router.get('/react', function(req, res, next) {
  res.render('react');
});

module.exports = router;
