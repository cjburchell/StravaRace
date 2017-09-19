/**
 * Created by Christiaan on 2016-08-08.
 */
const express = require('express');
const async = require('async');
const database = require('../database/database');
const activity = require('../public/javascripts/activity');
const category = require('../public/javascripts/category');
const router = express.Router();
const PageData = require('../routes/data/pagedata');
const guid = require('../public/javascripts/guid');


function checkLogin(req, res, next) {
    if (!req.session.isLoggedIn || !req.session.isStravaLoggedIn)
    {
        res.redirect("/");
    }

    next();
}

function checkStravaLogin(req, res, next) {
    if (!req.session.isLoggedIn)
    {
        res.redirect("/");
    }

    next();
}

router.get('/create', checkLogin, function(req, res) {

    database.getCreatedUpcomingCount(req.session.athlete.id, function (err, upcomingCount)
    {
        if (err)
        {
            res.redirect("/");
            return;
        }

        if(upcomingCount >= req.session.user.maxActiveActivities )
        {
            res.redirect("/");
            return;
        }

        const newActivity = new activity.Activity();
        activity.ownerId = req.session.athlete.id;
        const newCat = new category.Category(guid.Create());
        newCat.name = "Open";
        newActivity.categories.push(newCat);

        const data = new PageData("Create | Activity | ", req.session);
        data.isCreating = true;
        data.activity = newActivity;

        res.render('edit', data);
    });
});

router.get('/edit/:id', checkLogin, function(req, res)
{
    database.getDocument(req.params.id, function (err, result)
    {
        if (err)
        {
            res.redirect("/");
            return;
        }

        var editActivity = result;
        if (editActivity.ownerId !== req.session.athlete.id)
        {
            res.redirect("/");
            return;
        }

        activity.UpdateActivityState(editActivity);

        var data = new PageData(editActivity.name + " | Edit | Activity | ", req.session);
        data.isCreating = false;
        data.activity = editActivity;

        res.render('edit', data);
    });
});

router.get('/manage', checkLogin, function(req, res)
{
    var userId = req.session.athlete.id;
    if(req.session.user.role === 'dev')
    {
        userId = undefined;
    }


    database.getActivities(userId, function (err, result)
    {
        if (err)
        {
            res.redirect("/");
            return;
        }

        var data = new PageData("Manage Activities | ", req.session);
        data.activities = result;

        activity.UpdateActivities(data);
        res.render('manage', data);
    });
});

router.get('/join', checkStravaLogin, function(req, res)
{
    var userId = req.session.athlete.id;
    if(userId === undefined)
    {
        userId = req.session.facebookId;
    }

    database.getAthleteActivities(userId, function (err, joinedActivities)
    {
        if (err)
        {
            res.redirect("/");
            return;
        }

        database.getPublicActivities(function (err, result)
        {
            if (err)
            {
                res.redirect("/");
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
                    res.redirect("/");
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
            res.redirect("/");
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