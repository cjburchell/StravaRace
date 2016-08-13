/**
 * Created by Christiaan on 2016-08-11.
 */
var express = require('express');
var router = express.Router();
var results = require('../results');
var database = require('../database');

router.post('/race/:id', function(req, res) {
    if(req.session.isLoggedIn)
    {
        database.getDocument(req.params.id, function (err, race) {
            if(!err)
            {
                if (race.ownerId === req.session.athlete.id)
                {
                    results.updateRace(race, req.session.accessToken, function (result)
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
                    results.updateParticipant(req.params.id, participant.raceId, req.session.accessToken, function (result)
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