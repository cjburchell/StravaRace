/**
 * Created by Christiaan on 2016-08-08.
 */
var express = require('express');
var async = require('async');
var database = require('../database');
var activity = require('../public/javascripts/activity');
var category = require('../public/javascripts/category');
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

router.get('/edit/:id', function(req, res)
{
    if (!req.session.isLoggedIn)
    {
        res.render('nav_to', {navLocation: "/"});
        return;
    }

    database.getDocument(req.params.id, function (err, result)
    {
        if (err)
        {
            res.render('nav_to', {navLocation: "/"});
            return;
        }

        var editActivity = result;
        if (editActivity.ownerId !== req.session.athlete.id)
        {
            res.render('nav_to', {navLocation: "/"});
            return;
        }

        activity.UpdateActivityState(editActivity);
        var data = {
            titleText: editActivity.name + " | Edit | Activity | ",
            url: process.env.APP_URL,
            appName: process.env.APP_NAME,
            mode: 'activity',
            athlete: req.session.athlete,
            user: req.session.user,
            isCreating: false,
            activity: editActivity
        };
        res.render('edit', data);
    });
});

router.get('/manage', function(req, res)
{
    if (!req.session.isLoggedIn)
    {
        res.render('nav_to', {navLocation: "/"});
        return;
    }

    database.getActivities(req.session.athlete.id, function (err, result)
    {
        if (err)
        {
            res.render('nav_to', {navLocation: "/"});
            return;
        }

        var data = {
            titleText: "Manage Activities | ",
            url: process.env.APP_URL,
            appName: process.env.APP_NAME,
            mode: 'activity',
            athlete: req.session.athlete,
            activities: result
        };

        activity.UpdateActivities(data);
        res.render('manage', data);
    });
});

router.get('/join', function(req, res)
{
    if (!req.session.isLoggedIn)
    {
        res.render('nav_to', {navLocation: "/"});
        return;
    }
    database.getAthleteActivities(req.session.athlete.id, function (err, joinedActivities)
    {
        if (err)
        {
            res.render('nav_to', {navLocation: "/"});
            return;
        }

        database.getPublicActivities(function (err, result)
        {
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
                var isJoined = joinedActivities.findIndex(joined => item._id === joined._id) === -1;
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
});

router.get('/details/:id', function(req, res) {

    async.parallel({
        activity : callback => {
        "use strict";
        database.getDocument(req.params.id, function (err, editActivity)
        {
            if(err)
            {
                callback(err);
                return;
            }

            activity.UpdateActivityState(editActivity);
            callback(null, editActivity);
        });
    },
        participants: callback => {
        "use strict";

        database.getActivityParticipants(req.params.id, function (err, participants)
        {
            if(err)
            {
                callback(err);
                return;
            }

            callback(null, participants);
        });
    }}, (err, results) =>{
        "use strict";

        if(err)
        {
            res.render('nav_to', {navLocation:"/"});
            return;
        }

        var data = {
            titleText: results.activity.name + " | Activity | ",
            url : process.env.APP_URL,
            appName : process.env.APP_NAME,
            mode : 'activity',
            isLoggedIn : req.session.isLoggedIn,
            athlete : req.session.athlete,
            user: req.session.user,
            stravaClientId: process.env.STRAVA_CLIENT_ID,
            stravaRedirect: process.env.STRAVA_REDIRECT_URI,
            activity : results.activity,
            participants : results.participants
        };
        res.render('details', data);

    });
});

module.exports = router;