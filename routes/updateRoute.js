/**
 * Created by Christiaan on 2016-08-11.
 */
var express = require('express');
var router = express.Router();
var results = require('../results');
var database = require('../database');

router.post('/activity/:id', function(req, res) {
    if(req.session.isLoggedIn)
    {
        database.getDocument(req.params.id, function (err, activity) {
            if(!err)
            {
                if (activity.ownerId === req.session.athlete.id)
                {
                    results.updateActivity(activity, req.session.accessToken, function (result)
                    {
                        res.end(JSON.stringify(result));
                    });
                }
                else
                {
                    res.end(JSON.stringify(false));
                }
            }
            else
            {
                res.end( JSON.stringify(false) );
            }
        });
    }
    else
    {
        res.end( JSON.stringify(false) );
    }
});

router.post('/participant/:id', function(req, res) {
    if(req.session.isLoggedIn)
    {
        database.getDocument(req.params.id, function (err, participant) {
            if(!err)
            {
                if (participant.athleteId === req.session.athlete.id)
                {
                    results.updateParticipant(req.params.id, participant.activityId, req.session.accessToken, function (result)
                    {
                        res.end(JSON.stringify(result));
                    });
                }
                else
                {
                    res.end(JSON.stringify(false));
                }
            }
            else
            {
                res.end( JSON.stringify(false) );
            }
        });
    }
    else
    {
        res.end( JSON.stringify(false) );
    }
});

module.exports = router;