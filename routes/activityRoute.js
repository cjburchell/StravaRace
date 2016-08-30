/**
 * Created by Christiaan on 2016-08-08.
 */
var express = require('express');
var async = require('async');
var database = require('../database');
var activity = require('../public/javascripts/activity');
var category = require('../public/javascripts/category');
var router = express.Router();
var PageData = require('../routes/data/pagedata');

function createGuid()
{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

router.get('/create', function(req, res) {
    if (!req.session.isLoggedIn || !req.session.isStravaLoggedIn)
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

        var data = new PageData("Create | Activity | ", req.session);
        data.isCreating = true;
        data.activity = newActivity;

        res.render('edit', data);
    });
});

router.get('/edit/:id', function(req, res)
{
    if (!req.session.isLoggedIn || !req.session.isStravaLoggedIn)
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

        var data = new PageData(editActivity.name + " | Edit | Activity | ", req.session);
        data.isCreating = false;
        data.activity = editActivity;

        res.render('edit', data);
    });
});

router.get('/manage', function(req, res)
{
    if (!req.session.isLoggedIn || !req.session.isStravaLoggedIn)
    {
        res.render('nav_to', {navLocation: "/"});
        return;
    }

    var userId = req.session.athlete.id;
    if(req.session.user.role === 'dev')
    {
        userId = undefined;
    }


    database.getActivities(userId, function (err, result)
    {
        if (err)
        {
            res.render('nav_to', {navLocation: "/"});
            return;
        }

        var data = new PageData("Manage Activities | ", req.session);
        data.activities = result;

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


    var userId = req.session.athlete.id;
    if(userId === undefined)
    {
        userId = req.session.facebookId;
    }

    database.getAthleteActivities(userId, function (err, joinedActivities)
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

            var data = new PageData("Join Activity | ", req.session);
            data.activities = [];

            var currentTime = new Date();

            function filterActivity(item)
            {
                var isJoined = joinedActivities.findIndex(joined => item._id === joined._id) === -1;
                return (new Date(item.endTime) - currentTime) > 0 && isJoined;
            }

            data.activities = data.activities.concat(result.filter(filterActivity));

            database.getPrivateActivities(userId, function (err, result)
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
    },
        comments: callback => {
            "use strict";

            database.getActivityComments(req.params.id, function (err, comments)
            {
                if(err)
                {
                    callback(err);
                    return;
                }

                callback(null, comments);
            });
        }}, (err, results) =>
    {
        "use strict";

        if (err)
        {
            res.render('nav_to', {navLocation: "/"});
            return;
        }

        var data = new PageData(results.activity.name + " | Activity | ", req.session);
        data.isActivity = true;
        data.activity = results.activity;
        data.comments = results.comments;
        data.participants = results.participants;

        res.render('details', data);

    });
});

module.exports = router;