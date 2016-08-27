/**
 * Created by Christiaan on 2016-08-09.
 */
var express = require('express');
var strava = require('strava-v3');
var database = require('../database');
var polyline = require('polyline');
var Comment = require('../documents/comment');
var async = require('async');
var router = express.Router();

router.put('/participant', function (req, res)
{
    if (!req.session.isLoggedIn)
    {
        res.end(JSON.stringify(false));
        return;
    }
    var participant = req.body;

    async.parallel(
        {
            activity: callback =>
            {
                "use strict";
                database.getDocument(participant.activityId, callback);
            },
            participantCount: callback=>
            {
                "use strict";
                database.getActivityParticipantsCount(participant.activityId, callback);
            }
        },
        (err, result)=>
        {
            "use strict";
            if (err)
            {
                res.end(JSON.stringify(false));
                return;
            }

            if (!((result.activity.privaicy == 'public' || result.activity.friends.indexOf(participant.athleteId) !== -1) && result.activity.maxParticipants > result.participantCount))
            {
                res.end(JSON.stringify(false));
                return;
            }

            database.updateDocument(participant, function (err, id)
            {
                if (err)
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

router.delete('/participant/:id', function(req, res)
{
    if (!req.session.isLoggedIn)
    {
        res.end(JSON.stringify(false));
        return;
    }

    var userId = req.session.athlete.id;
    if(userId === undefined)
    {
        userId = req.session.facebookId;
    }

    database.getDocument(req.params.id, function (err, participant)
    {
        if (err)
        {
            res.end(JSON.stringify(false));
            return;
        }

        if (participant.athleteId == userId)
        {
            database.deleteDocument(req.params.id, participant._rev, function (err)
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
        }
        else
        {
            database.getDocument(req.params.id, function (err, activity)
            {
                if (err)
                {
                    res.end(JSON.stringify(false));
                    return;
                }

                if (activity.ownerId !== userId)
                {
                    res.end(JSON.stringify(false));
                    return;
                }

                database.deleteDocument(req.params.id, participant._rev, function (err)
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
        }
    });
});

function UpdateFriends(athleteId, editActivity, done)
{
    console.log("STRAVA: List friends id: " + athleteId);
    strava.athletes.listFriends({id: athleteId}, (err, payload) =>
    {
        try
        {
            if (err)
            {
                done(err);
                return;
            }

            editActivity.friends = payload.map(item => item.id);
            editActivity.friends.push(athleteId);
            done(undefined);
        }
        catch (error)
        {
            console.log("ERROR: " + error);
            console.log(error.stack);
            done(error);
        }
    });
}

function UpdateActivity(editActivity, done)
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

    async.parallel([ callback =>
    {
        "use strict";
        if (!editActivity.routeId)
        {
            callback();
            return;
        }

        strava.streams.route({id: editActivity.routeId, types: []}, (err, payload) =>
        {
            "use strict";
            if (err)
            {
                callback(err);
            }

            try
            {
                var distance = payload.find(item => item.type === 'distance').data;
                var elevation = payload.find(item => item.type === 'altitude').data;
                editActivity.routelatlong = payload.find(item => item.type === 'latlng').data;

                editActivity.routeElevation = [];
                for (var i = 0; i < distance.length; i++)
                {
                    editActivity.routeElevation.push(
                        {
                            x: distance[i],
                            y: elevation[i]
                        });
                }

                callback();
            }
            catch (error)
            {
                console.log("ERROR: " + error);
                console.log(error.stack);
                callback(error);
            }
        });
    },
        callback =>
        {
            "use strict";

            async.each(editActivity.stages, (stage, callback)=>
            {
                "use strict";

                strava.streams.segment({id: stage.segmentId, types: ['distance', 'altitude']}, (err, payload) =>
                {
                    if(err)
                    {
                        callback(err);
                    }

                    try
                    {
                        var distance = payload.find(item => item.type === 'distance').data;
                        var elevation = payload.find(item => item.type === 'altitude').data;

                        stage.elevation = [];
                        for (var i = 0; i < distance.length; i++)
                        {
                            stage.elevation.push(
                                {
                                    x: distance[i],
                                    y: elevation[i]
                                });
                        }
                        callback();
                    }
                    catch (error)
                    {
                        console.log("ERROR: " + error);
                        console.log(error.stack);
                        callback(error);
                    }
                });
            }, callback);

        }], done);
}

router.put('/activity', function(req, res)
{
    if (!req.session.isLoggedIn || !req.session.isStravaLoggedIn)
    {
        res.end(JSON.stringify(false));
        return;
    }
    var newActivity = req.body;
    newActivity.ownerId = req.session.athlete.id;
    newActivity.ownerName = req.session.athlete.firstname + ' ' + req.session.athlete.lastname;
    newActivity._id = undefined;
    newActivity._rev = undefined;

    async.parallel([
        callback =>
        {
            "use strict";
            UpdateActivity(newActivity, callback);
        },
        callback =>
        {
            "use strict";
            if (newActivity.privaicy === 'public')
            {
                callback();
                return;
            }

            UpdateFriends(req.session.athlete.id, newActivity, callback);
        }], err =>
    {
        "use strict";

        if (err)
        {
            res.end(JSON.stringify(false));
            return;
        }

        database.updateDocument(newActivity, function (err, id)
        {
            if (err)
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

router.delete('/activity/:id', function(req, res)
{
    if (!req.session.isLoggedIn || !req.session.isStravaLoggedIn)
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

        if (result.ownerId !== req.session.athlete.id)
        {
            res.end(JSON.stringify(false));
            return;
        }

        database.deleteDocument(req.params.id, result._rev, function (err)
        {
            if (err)
            {
                res.end(JSON.stringify(false));
                return;
            }

            async.parallel([callback =>
            {
                "use strict";

                database.getActivityParticipants(req.params.id, function (err, participants)
                {
                    if (err)
                    {
                        callback(err);
                        return;
                    }

                    if (participants.length === 0)
                    {
                        callback();
                        return;
                    }

                    async.each(participants, (participant, participantCallback) =>
                    {
                        "use strict";
                        database.deleteDocument(participant._id, participant.rev, participantCallback);
                    }, callback);
                });

            },
                callback =>
                {
                    "use strict";
                    database.getActivityComments(req.params.id, function (err, comments)
                    {
                        if (err)
                        {
                            callback(err);
                            return;
                        }

                        if (comments.length === 0)
                        {
                            callback();
                            return;
                        }

                        async.each(comments, (comment, commentCallback) =>
                        {
                            "use strict";
                            database.deleteDocument(comment._id, comment.rev, commentCallback);
                        }, callback);
                    });
                }
            ], err =>
            {
                "use strict";

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
});

router.post('/activity/:id', function(req, res)
{
    if (!(req.session.isLoggedIn || !req.session.isStravaLoggedIn))
    {
        res.end(JSON.stringify(false));
        return;
    }

    var updateActivity = req.body;
    updateActivity._id = req.params.id;
    updateActivity.ownerName = req.session.athlete.firstname + ' ' + req.session.athlete.lastname;

    database.getDocument(req.params.id,
        (err, activity) =>
        {
            if (err)
            {
                res.end(JSON.stringify(false));
                return;
            }

            "use strict";
            updateActivity._rev = activity._rev;
            if (activity.ownerId !== req.session.athlete.id)
            {
                res.end(JSON.stringify(false));
                return;
            }

            async.parallel([
                    callback =>
                    {
                        UpdateActivity(updateActivity, callback);
                    },
                    callback =>
                    {
                        if (updateActivity.privaicy === 'public')
                        {
                            callback();
                            return;
                        }

                        UpdateFriends(req.session.athlete.id, updateActivity, callback);
                    }],
                err =>
                {
                    if (err)
                    {
                        res.end(JSON.stringify(false));
                        return;
                    }

                    database.updateDocument(updateActivity, (err, id) =>
                    {
                        if (err)
                        {
                            res.end(JSON.stringify(false));
                            return;
                        }

                        res.end(id);
                    });

                });
        });
});

router.put('/comment/activity/:id', function (req, res)
{
    if (!req.session.isLoggedIn)
    {
        res.end(JSON.stringify(false));
        return;
    }

    if (req.body === undefined || req.body === '')
    {
        res.end(JSON.stringify(false));
        return;
    }

    var userId = req.session.athlete.id;
    if (userId === undefined)
    {
        userId = req.session.facebookId;
    }

    var comment = new Comment(req.body.text, userId, req.session.athlete.profile_medium, req.session.athlete.firstname + ' ' + req.session.athlete.lastname, req.params.id, Date.now())

    async.parallel(
        {
            activity: callback =>
            {
                "use strict";
                database.getDocument(req.params.id, callback);
            }
        },
        (err, result)=>
        {
            "use strict";
            if (err)
            {
                res.end(JSON.stringify(false));
                return;
            }

            if (!((result.activity.privaicy == 'public' || result.activity.friends.indexOf(userId) !== -1)))
            {
                res.end(JSON.stringify(false));
                return;
            }

            database.updateDocument(comment, function (err, id)
            {
                if (err)
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

router.get('/comment/activity/:id', function (req, res)
{
    if (!req.session.isLoggedIn)
    {
        res.end(JSON.stringify(false));
        return;
    }

    var userId = req.session.athlete.id;
    if(userId === undefined)
    {
        userId = req.session.facebookId;
    }

    async.parallel(
        {
            activity: callback =>
            {
                "use strict";
                database.getDocument(req.params.id, callback);
            },
            comments: callback =>
            {
                "use strict";
                database.getActivityComments(req.params.id, callback);
            }
        },
        (err, result)=>
        {
            "use strict";
            if (err)
            {
                res.end(JSON.stringify([]));
                return;
            }

            if (!((result.activity.privaicy == 'public' || result.activity.friends.indexOf(userId) !== -1)))
            {
                res.end(JSON.stringify([]));
                return;
            }

            res.end(JSON.stringify(result.comments[0]));
        });
});

module.exports = router;