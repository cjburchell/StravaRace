/**
 * Created by Christiaan on 2016-08-09.
 */
var express = require('express');
var router = express.Router();
var database = require('../database');
var activity = require('../public/javascripts/activity');

router.get('/history', function(req, res) {
    if(req.session.isLoggedIn)
    {
        database.getAthleteActivities(req.session.athlete.id, function (err, activities)
        {
            if(!err)
            {
                var data = {
                    titleText: "History | ",
                    url : process.env.APP_URL,
                    appName : process.env.APP_NAME,
                    mode : 'history',
                    athlete : req.session.athlete,
                    activities : activities
                };

                activity.UpdateActivities(data);

                res.render('history', data);
            }
            else
            {
                res.render('nav_to', {navLocation:"/"});
            }
        })
    }
    else
    {
        res.render('nav_to', {navLocation:"/"});
    }
});

module.exports = router;