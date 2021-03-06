/**
 * Created by Christiaan on 2016-08-09.
 */
const express = require('express');
const strava = require('strava-v3');
const router = express.Router();
const log = require('../log/log');

function authenticationMiddleware() {
    return  (req, res, next) =>{
        if (!req.session.isLoggedIn || !req.session.isStravaLoggedIn)
        {
            res.end(JSON.stringify(false));
            return;
        }

        next();
    }
}


router.get('/starredsegments', authenticationMiddleware(), (req, res ) => {

    log.print("STRAVA: List Starred Segments, page: " + req.params.id);
    strava.segments.listStarred({
        access_token: req.session.accessToken,
        per_page: req.query.per_page,
        page: req.query.page
    }, function (err, payload)
    {
        try
        {
            if (err)
            {
                res.end(JSON.stringify(false));
                return;
            }

            res.end(JSON.stringify(payload));
        }
        catch (error)
        {
            log.error(error.toString());
            log.error(error.stack);
        }
    })
});

router.get('/segmentmap/:id',  authenticationMiddleware(), (req, res ) => {
    log.print("STRAVA: Get segment map, segmentId: " + req.params.id);
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
            log.error(error.toString());
            log.error(error.stack);
        }
    })
});

router.get('/routes/', authenticationMiddleware(), (req, res ) => {
    log.print("STRAVA: Get Routes");
    strava.athlete.listRoutes({access_token: req.session.accessToken, id: req.session.athlete.id}, function (err, payload)
    {
        try
        {
            if (err)
            {
                res.end(JSON.stringify(false));
                return;
            }

            res.end(JSON.stringify(payload));
        }
        catch (error)
        {
            log.error(error.toString());
            log.error(error.stack);
        }
    })
});

router.get('/route/:id', authenticationMiddleware(), (req, res ) => {
    log.print("STRAVA: Get route, RouteId: " + req.params.id);
    strava.routes.get({access_token: req.session.accessToken, id: req.params.id}, function (err, payload)
    {
        try
        {
            if (err)
            {
                res.end(JSON.stringify(false));
                return;
            }

            res.end(JSON.stringify(payload));
        }
        catch (error)
        {
            log.error(error.toString());
            log.error(error.stack);
        }
    })
});

router.get('/friends/:id', authenticationMiddleware(), (req, res ) => {
    log.print("STRAVA: List of friends, page: " + req.params.id);
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
            log.error(error.toString());
            log.error(error.stack);
        }
    })
});

module.exports = router;