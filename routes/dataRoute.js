/**
 * Created by Christiaan on 2016-08-09.
 */
var express = require('express');
var strava = require('strava-v3');
var database = require('../database');
var polyline = require('polyline');
var router = express.Router();

router.put('/participant', function (req, res) {
    if(req.session.isLoggedIn) {
        var participant = req.body;

        database.getDocument(participant.activityId, function (err, activity) {
            if (err)
            {
                res.end(JSON.stringify(false));
                return;
            }

            database.getActivityParticipantsCount(participant.activityId, function (err, participantCount)
            {
                if (err)
                {
                    res.end(JSON.stringify(false));
                    return;
                }

                if (!((activity.privaicy == 'public' || activity.friends.indexOf(participant.athleteId) !== -1) && activity.maxParticipants > participantCount))
                {
                    res.end(JSON.stringify(false));
                    return;
                }

                database.updateDocument(participant, function (result, id)
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
            });
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
                    database.getDocument(req.params.id, function (err, activity) {
                        if (!err) {
                            if (activity.ownerId === req.session.athlete.id) {
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

function UpdateActivity(editActivity)
{
    var maxLat = -180;
    var minLat = 180;
    var maxLong = -180;
    var minLong = 180;
    editActivity.stages.forEach(function (stage)
    {
        if(stage.map !== undefined)
        {
            stage.map.points = polyline.decode(stage.map.polyline);

            maxLat = Math.max(maxLat, stage.start_latlng[0]);
            minLat = Math.min(minLat, stage.start_latlng[0]);
            maxLong = Math.max(maxLong, stage.start_latlng[1]);
            minLong = Math.min(minLong, stage.start_latlng[1]);

            maxLat = Math.max(maxLat, stage.end_latlng[0]);
            minLat = Math.min(minLat, stage.end_latlng[0]);
            maxLong = Math.max(maxLong, stage.end_latlng[1]);
            minLong = Math.min(minLong, stage.end_latlng[1]);

            stage.map.points.forEach(point => {
                "use strict";
                maxLat = Math.max(maxLat, point[0]);
                minLat = Math.min(minLat, point[0]);
                maxLong = Math.max(maxLong, point[1]);
                minLong = Math.min(minLong, point[1]);
            });
        }
    });

    if(editActivity.routeMap && editActivity.routeMap.polyline)
    {
        editActivity.routeMap.points = polyline.decode(editActivity.routeMap.polyline);

        editActivity.routeMap.points.forEach(point => {
            "use strict";
            maxLat = Math.max(maxLat, point[0]);
            minLat = Math.min(minLat, point[0]);
            maxLong = Math.max(maxLong, point[1]);
            minLong = Math.min(minLong, point[1]);
        });
    }

    var centerLat = (maxLat-minLat)/2 + minLat;
    var centerLong = (maxLong-minLong)/2 + minLong;

    editActivity.centerPoint = [
        centerLat,
        centerLong
    ];

    editActivity.boundingBox = [[
        minLat,
        minLong
    ],[
        maxLat,
        maxLong
    ]];
}

router.put('/activity', function(req, res) {
    if(req.session.isLoggedIn)
    {
        var newActivity = req.body;
        newActivity.ownerId = req.session.athlete.id;
        newActivity.ownerName = req.session.athlete.firstname + ' ' + req.session.athlete.lastname;
        newActivity._id = undefined;
        newActivity._rev = undefined;
        UpdateActivity(newActivity);
        if(newActivity.privaicy === 'public') {
            database.updateDocument(newActivity, function (result, id) {
                if(!result) {
                    res.end(JSON.stringify(false));
                } else {
                    res.end(id);
                }
            });
        }
        else
        {
            console.log("STRAVA: List friends id: " + req.session.athlete.id);
            strava.athletes.listFriends({ id : req.session.athlete.id }, function (err, payload) {
                try{
                    if(!err){
                        newActivity.friends = payload.map(function (item){ return item.id});
                        newActivity.friends.push(req.session.athlete.id);
                        database.updateDocument(newActivity, function (result, id) {
                            if(!result) {
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
                catch (error)
                {
                    console.log("ERROR: " + error);
                    console.log(error.stack);
                }
            });
        }
    }
    else
    {
        res.end( JSON.stringify(false) );
    }
});

router.delete('/activity/:id', function(req, res) {
    if (!req.session.isLoggedIn)
    {
        res.end(JSON.stringify(false));
        return;
    }

    database.getDocument(req.params.id, function (err, result)
    {
        if (err)
        {
            res.end(JSON.stringify(false));
            return;
        }

        if (result.ownerId === req.session.athlete.id)
        {
            database.deleteDocument(req.params.id, result._rev, function (result1)
            {
                if (!result1)
                {
                    res.end(JSON.stringify(false));
                    return;
                }

                database.getActivityParticipants(req.params.id, function (err, participants)
                {
                    if (err)
                    {
                        res.end(JSON.stringify(false));
                        return;
                    }

                    if (participants.length === 0)
                    {
                        res.end(JSON.stringify(true));
                        return;
                    }

                    participants.forEach(function (participant)
                    {
                        database.deleteDocument(participant._id, participant.rev, function (){});
                    });

                    res.end(JSON.stringify(true));
                });
            });
        }
        else
        {
            res.end(JSON.stringify(false));
        }
    })
});

router.post('/activity/:id', function(req, res) {
    if(req.session.isLoggedIn)
    {
        var updateActivity = req.body;
        database.getDocument(req.params.id, function (err, activity) {
            if(!err) {
                updateActivity._rev = activity._rev;
                updateActivity._id = req.params.id;
                updateActivity.ownerName = req.session.athlete.firstname + ' ' + req.session.athlete.lastname;
                if (activity.ownerId === req.session.athlete.id) {

                    UpdateActivity(updateActivity);
                    if(updateActivity.privaicy === 'public') {
                        database.updateDocument(updateActivity, function (result1, id) {
                            if(!result1) {
                                res.end(JSON.stringify(false));
                            } else {
                                res.end(id);
                            }
                        });
                    }
                    else
                    {
                        console.log("STRAVA: List friends id: " + req.session.athlete.id);
                        strava.athletes.listFriends({ id : req.session.athlete.id }, function (err, payload) {
                            try
                            {
                                if(!err){
                                    updateActivity.friends = payload.map(function (item){ return item.id});
                                    updateActivity.friends.push(req.session.athlete.id);
                                    database.updateDocument(updateActivity, function (result, id) {
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
                            }
                            catch (error)
                            {
                                console.log("ERROR: " + error);
                                console.log(error.stack);
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
        });
    }
    else
    {
        res.end( JSON.stringify(false) );
    }
});

module.exports = router;