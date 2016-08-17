/**
 * Created by Christiaan on 2016-08-09.
 */
var express = require('express');
var strava = require('strava-v3');
var router = express.Router();

router.get('/starredsegments/:id', function(req, res) {
    if (!req.session.isLoggedIn)
    {
        res.end(JSON.stringify(false));
        return;
    }

    console.log("STRAVA: List Starred Segments, page: " + req.params.id);
    strava.segments.listStarred({
        access_token: req.session.accessToken,
        page: req.params.id
    }, function (err, payload)
    {
        try
        {
            if (err)
            {
                res.end(JSON.stringify(false));
                return;
            }

            var segments = payload.filter(item => !item.private).map(item =>
            {
                return {
                    'id': item.id,
                    'name': item.name,
                    'activity_type': item.activity_type,
                    'distance': item.distance,
                    'start_latlng': item.start_latlng,
                    'end_latlng': item.end_latlng,
                    "city": item.city,
                    "state": item.state,
                    "country": item.country
                }
            });

            res.end(JSON.stringify(segments));
        }
        catch (error)
        {
            console.log("ERROR: " + error);
            console.log(error.stack);
        }
    })
});

router.get('/segmentmap/:id', function(req, res) {
    if (!req.session.isLoggedIn)
    {
        res.end(JSON.stringify(false));
        return;
    }

    console.log("STRAVA: Get segment map, segmentId: " + req.params.id);
    strava.segments.get({access_token: req.session.accessToken, id: req.params.id}, function (err, payload)
    {
        try
        {
            if (err)
            {
                res.end(JSON.stringify(false));
                return;
            }

            res.end(JSON.stringify({
                'map': payload.map,
                'name': payload.name,
                'start_latlng': payload.start_latlng,
                'end_latlng': payload.end_latlng
            }));
        }
        catch (error)
        {
            console.log("ERROR: " + error);
            console.log(error.stack);
        }
    })
});

router.get('/friends/:id', function(req, res) {
    if (!req.session.isLoggedIn)
    {
        res.end(JSON.stringify(false));
        return;
    }

    console.log("STRAVA: List of friends, page: " + req.params.id);
    strava.athlete.listFriends({
        access_token: req.session.accessToken,
        page: req.params.id,
        id: req.session.athlete.id
    }, function (err, payload)
    {
        try
        {
            if (err)
            {
                res.end(JSON.stringify(false));
                return;
            }

            var friends = payload.map(function (item)
            {
                if (!item.profile_medium || item.profile_medium === "avatar/athlete/medium.png")
                {
                    item.profile_medium = "/images/medium.png";
                }
                return {
                    'id': item.id,
                    'name': item.firstname + " " + item.lastname,
                    'profile_medium': item.profile_medium,
                    'sex': item.sex === null ? "M" : item.sex
                }
            });

            res.end(JSON.stringify(friends));
        }
        catch (error)
        {
            console.log("ERROR: " + error);
            console.log(error.stack);
        }
    })
});

module.exports = router;