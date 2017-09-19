/**
 * Created by Christiaan on 2016-08-11.
 */
var express = require('express');
var router = express.Router();
var results = require('../results');
var database = require('../database/database');

router.post('/activity/:id', function(req, res)
{
    if (!(req.session.isLoggedIn && req.session.isStravaLoggedIn))
    {
        res.end(JSON.stringify(false));
        return;
    }

    database.getDocument(req.params.id, function (err, activity)
    {
        if (err)
        {
            res.end(JSON.stringify(false));
            return;
        }

        if (activity.ownerId !== req.session.athlete.id)
        {
            res.end(JSON.stringify(false));
            return;
        }

        results.updateActivity(activity, req.session.accessToken, function (err)
        {
            if (err)
            {
                res.end(JSON.stringify(false));
            }
            else
            {
                res.end(JSON.stringify(true));
            }
        });
    });
});

router.post('/participant/:id', function(req, res)
{
    if (!(req.session.isLoggedIn && req.session.isStravaLoggedIn))
    {
        res.end(JSON.stringify(false));
        return;
    }
    database.getDocument(req.params.id, function (err, participant)
    {
        if (err)
        {
            res.end(JSON.stringify(false));
            return;
        }
        if (participant.athleteId !== req.session.athlete.id)
        {
            res.end(JSON.stringify(false));
            return;
        }
        results.updateParticipant(req.params.id, participant.activityId, req.session.accessToken, function (err)
        {
            if (err)
            {
                res.end(JSON.stringify(false));
            }
            else
            {
                res.end(JSON.stringify(true));
            }
        });
    });
});

module.exports = router;