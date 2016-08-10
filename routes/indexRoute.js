var express = require('express');
var strava = require('strava-v3');
var router = express.Router();

var renderPage = function (session, res) {
    var data = {
        mode: 'home',
        athlete: session.athlete
    };
    res.render('index', data);
};

/* GET home page. */
router.get('/', function (req, res) {
    if (req.session.isLoggedIn) {
        res.render('nav_to', {navLocation: "/home"});
    }
    else {
        var data = {
            stravaClientId: process.env.STRAVA_CLIENT_ID,
            stravaRedirect: process.env.STRAVA_REDIRECT_URI
        };
        res.render('login', data);
    }
});

router.get('/home', function (req, res) {
    if (req.session.isLoggedIn) {
        renderPage(req.session, res);
    }
    else {
        res.render('nav_to', {navLocation: "/"});
    }
});

router.get('/login', function (req, res) {
    if (req.session.isLoggedIn) {
        renderPage(req.session, res);
    }
    else {
        strava.oauth.getToken(req.query.code, function (err, payload) {
            if (!err) {
                req.session.isLoggedIn = true;
                req.session.athlete = payload.athlete;
                req.session.accessToken = payload.accessToken;

                res.render('nav_to', {navLocation: "/home"});
            }
            else {
                console.log(err);
            }
        });
    }
});

router.get('/logout', function (req, res) {
    if (req.session.isLoggedIn) {
        req.session.isLoggedIn = false;
        req.session.athlete = undefined;
        req.session.accessToken = undefined;
    }

    res.render('nav_to', {navLocation: "/"});
});


module.exports = router;
