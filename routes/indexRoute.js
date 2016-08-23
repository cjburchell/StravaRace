var express = require('express');
var strava = require('strava-v3');
var async = require('async');
var database = require('../database');
var user_utils = require('../public/javascripts/user');
var activity_utils = require('../public/javascripts/activity');
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
        callback =>
        {
            database.getInProgressAthleteActivities(session.athlete.id, function (err, docs, activitiesInProgress)
            {
                if (err)
                {
                    callback(err);
                }

                data.activitiesInProgress = activitiesInProgress;
                callback(null);
            }
            );
        },
        callback =>
        {
            database.getFinishedAthleteActivities(session.athlete.id, function (err, docs, activitiesFinished)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.activitiesFinished = activitiesFinished;
                    callback(null);
                }
            );
        },
        callback =>
        {
            database.getUpcomingAthleteActivities(session.athlete.id, function (err, docs, activitiesUpcoming)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    activitiesUpcoming.forEach(function (item)
                    {
                        activity_utils.UpdateActivityState(item.doc);
                    });

                    data.activitiesUpcoming = activitiesUpcoming;
                    callback(null);
                }
            );
        },
        callback =>
        {
            database.getCreatedUpcomingCount(session.athlete.id, function (err, createdUpcomingCount)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.createdUpcomingCount = createdUpcomingCount;
                    callback(null);
                }
            );
        },
        callback =>
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
        callback =>
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
        callback =>
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
        callback =>
        {
            database.getThirdPlaceCount(session.athlete.id, function (err, thirdCount)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.thridCount = thirdCount;
                    callback(null);
                }
            );
        }
    ], err =>
    {
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
                    user = new user_utils.User(payload.athlete.id, payload.athlete.firstname + " " + payload.athlete.lastname);
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
