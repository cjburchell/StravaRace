/**
 * Created by Christiaan on 2016-08-08.
 */
var express = require('express');
var strava = require('strava-v3');
var router = express.Router();

router.get('/create', function(req, res, next) {
    if(req.session.isLoggedIn)
    {
        var data = {
            title : 'Strava Race',
            mode : 'home',
            isLoggedIn : req.session.isLoggedIn ,
            athlete : req.session.athlete};
        res.render('create_race', data);
    }
    else
    {
        res.render('nav_to', {navLocation:"/"});
    }
});

module.exports = router;