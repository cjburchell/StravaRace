/**
 * Created by Christiaan on 2016-08-09.
 */
var express = require('express');
var strava = require('strava-v3');
var router = express.Router();

router.get('/starredsegments', function(req, res) {
    if(req.session.isLoggedIn)
    {
        strava.segments.listStarred({access_token:req.session.accessToken}, function (err, payload) {
            if(!err) {

                var segments = payload.filter(function (item) {
                    return !item.private;
                }).map(function (item) {
                    return {
                        'id' : item.id,
                        'name' : item.name,
                        'activity_type' : item.activity_type,
                        'distance' : item.distance
                    }
                });

                res.end( JSON.stringify( segments ));
            }
            else {
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