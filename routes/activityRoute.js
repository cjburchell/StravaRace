/**
 * Created by Christiaan on 2016-08-08.
 */
var express = require('express');
var database = require('../database');
var activity = require('../public/javascripts/activity');
var category = require('../public/javascripts/category');
var polyline = require('polyline');
var router = express.Router();

function createGuid()
{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

router.get('/create', function(req, res) {
    if (!req.session.isLoggedIn)
    {
        res.render('nav_to', {navLocation: "/"});
        return;
    }

    database.getCreatedUpcomingCount(req.session.athlete.id, function (err, upcomingCount)
    {
        if (err)
        {
            res.render('nav_to', {navLocation: "/"});
            return;
        }

        if(upcomingCount >= req.session.user.maxActiveActivities )
        {
            res.render('nav_to', {navLocation: "/"});
            return;
        }

        var newActivity = new activity.Activity();
        activity.ownerId = req.session.athlete.id;
        var newCat = new category.Category(createGuid());
        newCat.name = "Open";
        newActivity.categories.push(newCat);
        var data = {
            titleText: "Create | Activity | ",
            url: process.env.APP_URL,
            appName: process.env.APP_NAME,
            mode: 'activity',
            user: req.session.user,
            athlete: req.session.athlete,
            isCreating: true,
            activity: newActivity
        };
        res.render('edit', data);
    });
});

router.get('/edit/:id', function(req, res) {
    if(req.session.isLoggedIn)
    {
        database.getDocument(req.params.id, function (err , result) {
            if(!err) {
                var editActivity = result;
                if (editActivity.ownerId === req.session.athlete.id) {
                    activity.UpdateActivityState(editActivity);
                    var data = {
                        titleText: editActivity.name + " | Edit | Activity | ",
                        url : process.env.APP_URL,
                        appName : process.env.APP_NAME,
                        mode: 'activity',
                        athlete: req.session.athlete,
                        user: req.session.user,
                        isCreating: false,
                        activity: editActivity
                    };
                    res.render('edit', data);
                }
                else {
                    res.render('nav_to', {navLocation: "/"});
                }
            }
            else
            {
                res.render('nav_to', {navLocation:"/"});
            }
        });
    }
    else
    {
        res.render('nav_to', {navLocation:"/"});
    }
});

router.get('/manage', function(req, res) {
    if(req.session.isLoggedIn)
    {
        database.getActivities(req.session.athlete.id, function (err, result) {
            if(!err) {
                var data = {
                    titleText: "Manage Activities | ",
                    url : process.env.APP_URL,
                    appName : process.env.APP_NAME,
                    mode: 'activity',
                    athlete: req.session.athlete,
                    activities: result
                };

                activity.UpdateActivities(data);
                res.render('manage', data);
            }
            else
            {
                res.render('nav_to', {navLocation:"/"});
            }
        });
    }
    else
    {
        res.render('nav_to', {navLocation:"/"});
    }
});

router.get('/join', function(req, res) {
    if(req.session.isLoggedIn)
    {
        database.getAthleteActivities(req.session.athlete.id, function (err, joinedActivities)
        {
            if (err)
            {
                res.render('nav_to', {navLocation: "/"});
                return;
            }

            database.getPublicActivities(function (err, result) {
                if (err)
                {
                    res.render('nav_to', {navLocation: "/"});
                    return;
                }

                var data = {
                    titleText: "Join Activity | ",
                    url: process.env.APP_URL,
                    appName: process.env.APP_NAME,
                    mode: 'activity',
                    athlete: req.session.athlete,
                    activities: []
                };

                var currentTime = new Date();
                function filterActivity(item)
                {
                    var isJoined = joinedActivities.findIndex(function (joined)
                        {
                            return item._id === joined._id;
                        }) === -1;
                    return (new Date(item.endTime) - currentTime) > 0 && isJoined;
                }

                data.activities = data.activities.concat(result.filter(filterActivity));

                database.getPrivateActivities(req.session.athlete.id, function (err, result)
                {
                    if (err)
                    {
                        res.render('nav_to', {navLocation: "/"});
                        return;
                    }

                    data.activities = data.activities.concat(result.filter(filterActivity));
                    activity.UpdateActivities(data);
                    res.render('join', data);
                });

            });
        });
    }
    else
    {
        res.render('nav_to', {navLocation:"/"});
    }
});

router.get('/details/:id', function(req, res) {
    database.getDocument(req.params.id, function (err, editActivity)
    {
        if(!err)
        {
            database.getActivityParticipants(req.params.id, function (err, participants)
            {
                if(!err)
                {
                    activity.UpdateActivityState(editActivity);

                    var maxLat = -180;
                    var minLat = 180;
                    var maxLong = -180;
                    var minLong = 180;
                    editActivity.stages.forEach(function (stage)
                    {
                        if(stage.map !== undefined)
                        {
                            stage.map.points = polyline.decode(stage.map.polyline);

                            maxLat = Math.max(maxLat, stage.start_latlng[0]);
                            minLat = Math.min(minLat, stage.start_latlng[0]);
                            maxLong = Math.max(maxLong, stage.start_latlng[1]);
                            minLong = Math.min(minLong, stage.start_latlng[1]);

                            maxLat = Math.max(maxLat, stage.end_latlng[0]);
                            minLat = Math.min(minLat, stage.end_latlng[0]);
                            maxLong = Math.max(maxLong, stage.end_latlng[1]);
                            minLong = Math.min(minLong, stage.end_latlng[1]);
                        }
                    });

                    var centerLat = (maxLat-minLat)/2 + minLat;
                    var centerLong = (maxLong-minLong)/2 + minLong;

                    editActivity.centerPoint = [
                        centerLat,
                        centerLong
                    ];

                    editActivity.boundingBox = [[
                        minLat,
                        minLong
                    ],[
                        maxLat,
                        maxLong
                    ]];

                    var data = {
                        titleText: editActivity.name + " | Activity | ",
                        url : process.env.APP_URL,
                        appName : process.env.APP_NAME,
                        mode : 'activity',
                        isLoggedIn : req.session.isLoggedIn,
                        athlete : req.session.athlete,
                        user: req.session.user,
                        stravaClientId: process.env.STRAVA_CLIENT_ID,
                        stravaRedirect: process.env.STRAVA_REDIRECT_URI,
                        activity : editActivity,
                        participants : participants
                    };
                    res.render('details', data);
                }
                else
                {
                    res.render('nav_to', {navLocation:"/"});
                }
            });
        }
        else
        {
            res.render('nav_to', {navLocation:"/"});
        }
    });
});

module.exports = router;