/**
 * Created by Christiaan on 2016-08-09.
 */
var express = require('express');
var strava = require('strava-v3');
var database = require('../database');
var router = express.Router();

router.put('/race', function(req, res) {
    if(req.session.isLoggedIn)
    {
        var newRace = req.body;
        newRace.ownerId = req.session.athlete.id;
        newRace.ownerName = req.session.athlete.firstname + ' ' + req.session.athlete.lastname;
        newRace._id = '';
        newRace._rev = undefined;
        if(newRace.privaicy === 'public') {
            database.updateRace(newRace, function (result, id) {
                if(!result) {
                    res.end(JSON.stringify(result));
                } else {
                    res.end(id);
                }
            });
        }
        else
        {
            strava.athletes.listFriends({ id : req.session.athlete.id }, function (err, payload) {
                if(!err){
                    newRace.friends = payload.map(function (item){ return item.id});
                    newRace.friends.push(req.session.athlete.id);
                    database.updateRace(newRace, function (result, id) {
                        if(!result) {
                            res.end(JSON.stringify(result));
                        } else {
                            res.end(id);
                        }
                    });
                }else
                {
                    res.end( JSON.stringify(false) );
                }
                
            });
        }
    }
    else
    {
        res.end( JSON.stringify(false) );
    }
});

router.post('/race/:id', function(req, res) {
    if(req.session.isLoggedIn)
    {
        var updateRace = req.body;
        database.getRace(req.params.id, function (err, result) {
            if(!err) {
                updateRace._rev = result._rev;
                updateRace._id = req.params.id;
                updateRace.ownerName = req.session.athlete.firstname + ' ' + req.session.athlete.lastname;
                if (result.ownerId === req.session.athlete.id) {

                    if(updateRace.privaicy === 'public') {
                        database.updateRace(updateRace, function (result1, id) {
                            if(!result1) {
                                res.end(JSON.stringify(result1));
                            } else {
                                res.end(id);
                            }
                        });
                    }
                    else
                    {
                        strava.athletes.listFriends({ id : req.session.athlete.id }, function (err, payload) {
                            if(!err){
                                updateRace.friends = payload.map(function (item){ return item.id});
                                updateRace.friends.push(req.session.athlete.id);
                                database.updateRace(updateRace, function (result, id) {
                                    if(!result) {
                                        res.end(JSON.stringify(result));
                                    } else {
                                        res.end(id);
                                    }
                                });
                            }else
                            {
                                res.end( JSON.stringify(false) );
                            }
                        });
                    }
                }
                else {
                    res.end(JSON.stringify(false));
                }
            }
            else
            {
                res.end( JSON.stringify(false) );
            }
        })

    }
    else
    {
        res.end( JSON.stringify(false) );
    }
});

module.exports = router;