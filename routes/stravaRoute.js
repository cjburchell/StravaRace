/**
 * Created by Christiaan on 2016-08-09.
 */
var express = require('express');
var strava = require('strava-v3');
var router = express.Router();

router.get('/starredsegments/:id', function(req, res) {
    if(req.session.isLoggedIn)
    {
        console.log("STRAVA: List Starred Segments, page: "+ req.params.id);
        strava.segments.listStarred({access_token:req.session.accessToken, page:req.params.id}, function (err, payload)
        {
            try
            {
                if (!err)
                {
                    var segments = payload.filter(function (item)
                    {
                        return !item.private;
                    }).map(function (item)
                    {
                        return {
                            'id': item.id,
                            'name': item.name,
                            'activity_type': item.activity_type,
                            'distance': item.distance
                        }
                    });

                    res.end(JSON.stringify(segments));
                }
                else
                {
                    res.end(JSON.stringify(false));
                }
            }
            catch (error)
            {
                console.log("ERROR: " + error);
                console.log(error.stack);
            }
        })
    }
    else
    {
        res.end( JSON.stringify(false) );
    }
});

module.exports = router;