var express = require('express');
var strava = require('strava-v3');
var async = require('async');
var database = require('../database');
var User = require('../documents/user');
var PageData = require('../routes/data/pagedata');
var activity_utils = require('../public/javascripts/activity');
var FB = require('fb');
var router = express.Router();

function renderPage(session, res) {

    var data = new PageData("Home | ", session);

    var userId = session.athlete.id;
    if(userId === undefined)
    {
        userId = session.facebookId;
    }

    async.parallel([
        callback =>
        {
            database.getInProgressAthleteActivities(userId, function (err, docs, activitiesInProgress)
            {
                if (err)
                {
                    callback(err);
                }

                data.activitiesInProgress = activitiesInProgress;
                callback();
            }
            );
        },
        callback =>
        {
            database.getFinishedAthleteActivities(userId, function (err, docs, activitiesFinished)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.activitiesFinished = activitiesFinished;
                    callback();
                }
            );
        },
        callback =>
        {
            database.getUpcomingAthleteActivities(userId, function (err, docs, activitiesUpcoming)
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
                    callback();
                }
            );
        },
        callback =>
        {
            database.getCreatedUpcomingCount(userId, function (err, createdUpcomingCount)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.createdUpcomingCount = createdUpcomingCount;
                    callback();
                }
            );
        },
        callback =>
        {
            database.getFinishedCount(userId, function (err, finishedCount)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.finishedCount = finishedCount;
                    callback();
                }
            );
        },
        callback =>
        {
            database.getFirstPlaceCount(userId, function (err, firstCount)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.firstCount = firstCount;
                    callback();
                }
            );
        },
        callback =>
        {
            database.getSecondPlaceCount(userId, function (err, secondCount)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.secondCount = secondCount;
                    callback();
                }
            );
        },
        callback =>
        {
            database.getThirdPlaceCount(userId, function (err, thirdCount)
                {
                    if (err)
                    {
                        callback(err);
                    }

                    data.thridCount = thirdCount;
                    callback();
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
        var data = new PageData("");
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

router.get('/faq', function (req, res) {
    var data = new PageData("FAQs | ", req.session);
    res.render('faq', data);
});

router.get('/about', function (req, res) {
    var data = new PageData("About | ", req.session);
    res.render('about', data);
});

router.post('/fblogin', (req, res) =>{
    "use strict";
    if (req.session.isFacebookLoggedIn)
    {
        res.end(JSON.stringify(false));
        return;
    }

    var authResponse = req.body;
    FB.setAccessToken(authResponse.accessToken);

    FB.api('/me', {fields: 'id, first_name, last_name, email, gender'}, function(user_info) {
        if(!user_info || user_info.error) {
            res.end(JSON.stringify(false));
            return;
        }

     FB.api('/'+authResponse.userID+'/picture', {redirect: 0, type: 'small'}, function(photo) {
         if(!photo || photo.error) {
             res.end(JSON.stringify(false));
             return;
         }

         var userId = parseInt(authResponse.userID);

         database.getFBUser(userId, function (err, user)
         {
             if (err)
             {
                 res.render('nav_to', {navLocation: "/"});
                 return;
             }

             function updateResult(err, id)
             {
                 if (err)
                 {
                     res.render('nav_to', {navLocation: "/"});
                     return;
                 }

                 if(!req.session.athlete)
                 {
                     req.session.athlete = {
                         profile_medium: photo.data.url,
                         firstname: user_info.first_name,
                         lastname: user_info.last_name,
                         email: user_info.email,
                         sex: user_info.gender === 'female' ? 'F' : 'M'
                     };

                     if (!req.session.athlete.profile_medium)
                     {
                         req.session.athlete.profile_medium = "/images/medium.png";
                     }
                 }

                 user._id = id;
                 req.session.isLoggedIn = true;
                 req.session.isFacebookLoggedIn = true;
                 if(user.athleteId)
                 {
                     req.session.isStravaLoggedIn = true;
                     req.session.athlete.id = user.athleteId;
                     req.session.accessToken = user.accessToken;
                 }
                 else
                 {
                     req.session.isStravaLoggedIn = false;
                 }
                 req.session.user = user;
                 req.session.facebookId = userId;
                 req.session.fbAccessToken = authResponse.accessToken;
                 res.end(JSON.stringify(true));
             }


             var name = user_info.first_name + " " + user_info.last_name;
             if (!user)
             {

                 user = new User(undefined, name, userId);
                 user.email = user_info.email;
                 user.accessToken = req.session.accessToken;
                 database.updateDocument(user, updateResult);
             }
             else
             {
                 if(user.name !== name || user.email !== user_info.email || ( req.session.accessToken !== undefined && user.accessToken !== req.session.accessToken))
                 {
                     user.email = user_info.email;
                     user.name = name;
                     user.accessToken = req.session.accessToken;
                     database.updateDocument(user, updateResult);
                     return;
                 }

                 updateResult(undefined, user._id);
             }
         });
     });
     });
});

router.get('/login', function (req, res) {
    if (req.session.isStravaLoggedIn)
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

                function updateResult(err, id)
                {
                    if (err)
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
                    req.session.isStravaLoggedIn = true;
                    if(user.facebookId)
                    {
                        req.session.isFacebookLoggedIn = true;
                    }
                    else
                    {
                        req.session.isFacebookLoggedIn = false;
                    }

                    req.session.user = user;
                    req.session.athlete = payload.athlete;
                    req.session.accessToken = payload.access_token;
                    res.render('nav_to', {navLocation: "/home"});
                }

                var name = payload.athlete.firstname + " " + payload.athlete.lastname;
                if (!user)
                {
                    user = new User(payload.athlete.id, name);
                    user.email = payload.athlete.email;
                    user.accessToken = payload.access_token;
                    database.updateDocument(user, updateResult);
                }
                else
                {
                    if(user.name !== name || user.email !== payload.athlete.email || user.accessToken !== payload.access_token)
                    {
                        user.email = payload.athlete.email;
                        user.name = name;
                        user.accessToken = payload.access_token;
                        database.updateDocument(user, updateResult);
                        return;
                    }

                    updateResult(undefined, user._id);
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
        req.session.isFacebookLoggedIn = false;
        req.session.isStravaLoggedIn = false;
        req.session.user = undefined;
        req.session.athlete = undefined;
        req.session.accessToken = undefined;
    }

    res.render('nav_to', {navLocation: "/"});
});


module.exports = router;
