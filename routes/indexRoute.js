var express = require('express');
var strava = require('strava-v3');
var async = require('async');
var database = require('../database');
var user_utils = require('../public/javascripts/user');
var race_utils = require('../public/javascripts/race');
var router = express.Router();

var renderPage = function (session, res) {

    var data = {
        mode: 'home',
        appName: process.env.APP_NAME,
        url: process.env.APP_URL,
        titleText: "Home | ",
        athlete: session.athlete,
        user: session.user
    };

    async.parallel([
        function (callback)
        {
            database.getInProgressAthleteRaces(session.athlete.id, function (err, docs, racesInProgress)
            {
                if (err)
                {
                    callback(err);
                }

                data.racesInProgress = racesInProgress;
                callback(null);
            }
            );
        },
        function (callback)
        {
            database.getFinishedAthleteRaces(session.athlete.id, function (err, docs, racesFinished)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.racesFinished = racesFinished;
                    callback(null);
                }
            );
        },
        function (callback)
        {
            database.getUpcommingAthleteRaces(session.athlete.id, function (err, docs, racesUpcomming)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    racesUpcomming.forEach(function (item)
                    {
                        race_utils.UpdateRaceState(item.doc);
                    });

                    data.racesUpcomming = racesUpcomming;
                    callback(null);
                }
            );
        },
        function (callback)
        {
            database.getCreatedUpcommingCount(session.athlete.id, function (err, createdUpcommingCount)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.createdUpcommingCount = createdUpcommingCount;
                    callback(null);
                }
            );
        },
        function (callback)
        {
            database.getFinishedCount(session.athlete.id, function (err, finishedCount)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.finishedCount = finishedCount;
                    callback(null);
                }
            );
        },
        function (callback)
        {
            database.getFirstPlaceCount(session.athlete.id, function (err, firstCount)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.firstCount = firstCount;
                    callback(null);
                }
            );
        },
        function (callback)
        {
            database.getSecondPlaceCount(session.athlete.id, function (err, secondCount)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.secondCount = secondCount;
                    callback(null);
                }
            );
        },
        function (callback)
        {
            database.getThirdPlaceCount(session.athlete.id, function (err, thridCount)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.thridCount = thridCount;
                    callback(null);
                }
            );
        }
    ], function (err) {
        if(err)
        {
            return;
        }

        res.render('index', data);
    });
};

/* GET home page. */
router.get('/', function (req, res) {
    if (req.session.isLoggedIn) {
        res.render('nav_to', {navLocation: "/home"});
    }
    else {
        var data = {
            titleText: "",
            url : process.env.APP_URL,
            appName : process.env.APP_NAME,
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
        return;
    }

    console.log("STRAVA: Get Token");
    strava.oauth.getToken(req.query.code, function (err, payload)
    {
        try
        {
            if (err)
            {
                console.log("ERROR: " + err);
                res.render('nav_to', {navLocation: "/"});
                return;
            }

            database.getUser(payload.athlete.id, function (result, user)
            {
                if (result)
                {
                    res.render('nav_to', {navLocation: "/"});
                    return;
                }

                function updateResult(result, id)
                {
                    if (!result)
                    {
                        res.render('nav_to', {navLocation: "/"});
                        return;
                    }

                    if (!payload.athlete.profile_medium)
                    {
                        payload.athlete.profile_medium = "/images/medium.png";
                    }
                    if (payload.athlete.profile_medium === "avatar/athlete/medium.png")
                    {
                        payload.athlete.profile_medium = "/images/medium.png";
                    }
                    user._id = id;
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    req.session.athlete = payload.athlete;
                    req.session.accessToken = payload.access_token;
                    res.render('nav_to', {navLocation: "/home"});
                }

                if (!user)
                {
                    user = new user_utils.User(payload.athlete.id);
                    database.updateDocument(user, updateResult);
                }
                else
                {
                    updateResult(true, user._id);
                }
            });
        }
        catch (error)
        {
            console.log("ERROR: " + error);
            console.log(error.stack);
        }
    });
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
