var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var data = { title: 'Strava Race', isLoggedIn : false , userName:'Test'};
  console.log(req);
  res.render('index', data);
});

module.exports = router;
