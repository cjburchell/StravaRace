/**
 * Created by Christiaan on 2016-08-09.
 */
var express = require('express');
var router = express.Router();
var database = require('../database');
var activity = require('../public/javascripts/activity');
var PageData = require('../routes/data/pagedata');

router.get('/history', function(req, res) {
    if(req.session.isLoggedIn)
    {
        var userId = req.session.athlete.id;
        if(userId === undefined)
        {
            userId = req.session.facebookId;
        }

        database.getAthleteActivities(userId, function (err, activities)
        {
            if(!err)
            {
                var data = new PageData("History | ", req.session);
                data.activities= activities;
                activity.UpdateActivities(data);

                res.render('history', data);
            }
            else
            {
                res.redirect("/");
            }
        })
    }
    else
    {
        res.redirect("/");
    }
});

router.get('/list', function(req, res) {
    if(req.session.isLoggedIn && req.session.user.role === 'dev')
    {
        database.getUsers(function (err, users)
        {
            if(!err)
            {
                var data = new PageData("Users | ", req.session);
                data.users = users;
                res.render('users', data);
            }
            else
            {
                res.redirect("/");
            }
        })
    }
    else
    {
        res.redirect("/");
    }
});

module.exports = router;