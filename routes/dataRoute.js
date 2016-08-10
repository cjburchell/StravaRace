/**
 * Created by Christiaan on 2016-08-09.
 */
var express = require('express');
var strava = require('strava-v3');
var database = require('../database');
var router = express.Router();

router.put('/participant', function (req, res) {
    if(req.session.isLoggedIn) {
        var participant = req.body;
        participant.athleteId = req.session.athlete.id;

        database.getDocument(participant.raceId, function (err, race) {
            if(!err)
            {
                if(race.privaicy == 'public' || race.friends.indexOf(participant.athleteId) !== -1 )
                {
                    database.updateDocument(participant, function (result, id) {
                        if (!result) {
                            res.end(JSON.stringify(false));
                        } else {
                            res.end(id);
                        }
                    });
                }
                else
                {
                    res.end( JSON.stringify(false) );
                }
            }
            else
            {
                res.end( JSON.stringify(false) );
            }
        });
    }
    else {
        res.end( JSON.stringify(false) );
    }
});

router.post('/participant/:id', function (req, res) {
    if(req.session.isLoggedIn) {
        var newParticipant = req.body;
        newParticipant.athleteId = req.session.athlete.id;
        database.getDocument(req.params.id, function (err, old)
        {
            if(!err)
            {
                newParticipant._rev = old._rev;
                newParticipant.raceId = old.raceId;
                newParticipant._id = req.params.id;
                if(old.athleteId === req.session.athlete.id)
                {
                    database.updateDocument(newParticipant, function (result, id)
                    {
                        if (!result)
                        {
                            res.end(JSON.stringify(false));
                        }
                        else
                        {
                            res.end(id);
                        }
                    });
                }
                else
                {
                    res.end( JSON.stringify(false) );
                }
            }
            else
            {
                res.end( JSON.stringify(false) );
            }
        });
    }
    else {
        res.end( JSON.stringify(false) );
    }
});

router.delete('/participant/:id', function(req, res) {
    if(req.session.isLoggedIn)
    {
        database.getDocument(req.params.id, function (err, participant)
        {
            if(!err)
            {
                if (participant.athleteId === req.session.athlete.id)
                {
                    database.deleteDocument(req.params.id, participant._rev, function (result1) {
                        if(!result1) {
                            res.end(JSON.stringify(false));
                        } else {
                            res.end(JSON.stringify(true));
                        }
                    });
                }
                else {
                    database.getDocument(req.params.id, function (err, race) {
                        if (!err) {
                            if (race.ownerId === req.session.athlete.id) {
                                database.deleteDocument(req.params.id, participant._rev, function (result1) {
                                    if (!result1) {
                                        res.end(JSON.stringify(false));
                                    } else {
                                        res.end(JSON.stringify(true));
                                    }
                                });
                            }
                            else {
                                res.end(JSON.stringify(false));
                            }
                        }
                    });
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

router.put('/race', function(req, res) {
    if(req.session.isLoggedIn)
    {
        var newRace = req.body;
        newRace.ownerId = req.session.athlete.id;
        newRace.ownerName = req.session.athlete.firstname + ' ' + req.session.athlete.lastname;
        newRace._id = undefined;
        newRace._rev = undefined;
        if(newRace.privaicy === 'public') {
            database.updateDocument(newRace, function (result, id) {
                if(!result) {
                    res.end(JSON.stringify(false));
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
                    database.updateDocument(newRace, function (result, id) {
                        if(!result) {
                            res.end(JSON.stringify(false));
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

router.delete('/race/:id', function(req, res) {
    if(req.session.isLoggedIn)
    {
        database.getDocument(req.params.id, function (err, result) {
            if(!err) {
                if (result.ownerId === req.session.athlete.id) {
                        database.deleteDocument(req.params.id, result._rev, function (result1) {
                            if(!result1) {
                                res.end(JSON.stringify(false));
                            } else {
                                res.end(JSON.stringify(true));
                            }
                        });
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

router.post('/race/:id', function(req, res) {
    if(req.session.isLoggedIn)
    {
        var updateRace = req.body;
        database.getDocument(req.params.id, function (err, race) {
            if(!err) {
                updateRace._rev = race._rev;
                updateRace._id = req.params.id;
                updateRace.ownerName = req.session.athlete.firstname + ' ' + req.session.athlete.lastname;
                if (race.ownerId === req.session.athlete.id) {

                    if(updateRace.privaicy === 'public') {
                        database.updateDocument(updateRace, function (result1, id) {
                            if(!result1) {
                                res.end(JSON.stringify(false));
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
                                database.updateDocument(updateRace, function (result, id) {
                                    if(!result) {
                                        res.end(JSON.stringify(false));
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