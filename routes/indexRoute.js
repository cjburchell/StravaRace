var express = require('express');
var strava = require('strava-v3');
var database = require('../database');
var user_utils = require('../public/javascripts/user');
var race_utils = require('../public/javascripts/race');
var router = express.Router();

var renderPage = function (session, res) {
    database.getInProgressAthleteRaces(session.athlete.id, function (err, docs, racesInProgress)
    {
        if(!err)
        {
            database.getFinishedAthleteRaces(session.athlete.id, function (err, docs, racesFinished){
                if(!err)
                {
                    database.getUpcommingAthleteRaces(session.athlete.id, function (err, docs, racesUpcomming){
                        if(!err)
                        {
                            racesUpcomming.forEach(function (item)
                            {
                                race_utils.UpdateRaceState(item.doc);
                            });

                            var data = {
                                mode: 'home',
                                titleText: "Home | ",
                                athlete: session.athlete,
                                racesInProgress: racesInProgress,
                                racesFinished: racesFinished,
                                racesUpcomming: racesUpcomming
                            };
                            res.render('index', data);
                        }
                    });
                }
            });
        }
    })
};

/* GET home page. */
router.get('/', function (req, res) {
    if (req.session.isLoggedIn) {
        res.render('nav_to', {navLocation: "/home"});
    }
    else {
        var data = {
            titleText: "",
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
    if (req.session.isLoggedIn)
    {
        renderPage(req.session, res);
    }
    else
    {
        console.log("STRAVA: Get Token");
        strava.oauth.getToken(req.query.code, function (err, payload)
        {
            try
            {
                if (!err)
                {
                    database.getUser(payload.athlete.id, function (result, user)
                    {
                        if(!result)
                        {
                            function updateResult(result, id)
                            {
                                if(result)
                                {
                                    user._id = id;
                                    req.session.isLoggedIn = true;
                                    req.session.user = user;
                                    req.session.athlete = payload.athlete;
                                    req.session.accessToken = payload.access_token;
                                    res.render('nav_to', {navLocation: "/home"});
                                }
                                else
                                {
                                    res.render('nav_to', {navLocation: "/"});
                                }
                            }

                            if(!user)
                            {
                                user = new user_utils.User(payload.athlete.id);
                                database.updateDocument(user, updateResult);
                            }
                            else
                            {
                                updateResult(true, user._id);
                            }
                        }
                        else
                        {
                            res.render('nav_to', {navLocation: "/"});
                        }
                    });
                }
                else
                {
                    console.log("ERROR: " + err);
                    res.render('nav_to', {navLocation: "/"});
                }
            }
            catch (error)
            {
                console.log("ERROR: " + error);
                console.log(error.stack);
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
