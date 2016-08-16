/**
 * Created by Christiaan on 2016-08-08.
 */
var express = require('express');
var database = require('../database');
var race = require('../public/javascripts/race');
var category = require('../public/javascripts/category');
var polyline = require('polyline');
var router = express.Router();

function createGuid()
{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

router.get('/create', function(req, res) {
    if (!req.session.isLoggedIn)
    {
        res.render('nav_to', {navLocation: "/"});
        return;
    }

    database.getCreatedUpcommingCount(req.session.athlete.id, function (err, upcommingCount)
    {
        if (err)
        {
            res.render('nav_to', {navLocation: "/"});
            return;
        }

        if(upcommingCount >= req.session.user.maxActiveRaces )
        {
            res.render('nav_to', {navLocation: "/"});
            return;
        }

        var newRace = new race.Race();
        race.ownerId = req.session.athlete.id;
        var newCat = new category.Category(createGuid());
        newCat.name = "Open";
        newRace.categories.push(newCat);
        var data = {
            titleText: "Create | Race | ",
            url: process.env.APP_URL,
            appName: process.env.APP_NAME,
            mode: 'race',
            user: req.session.user,
            athlete: req.session.athlete,
            isCreating: true,
            race: newRace
        };
        res.render('edit_race', data);
    });
});

router.get('/edit/:id', function(req, res) {
    if(req.session.isLoggedIn)
    {
        database.getDocument(req.params.id, function (err , result) {
            if(!err) {
                var editRace = result;
                if (editRace.ownerId === req.session.athlete.id) {
                    race.UpdateRaceState(editRace);
                    var data = {
                        titleText: editRace.name + " | Edit | Race | ",
                        url : process.env.APP_URL,
                        appName : process.env.APP_NAME,
                        mode: 'race',
                        athlete: req.session.athlete,
                        user: req.session.user,
                        isCreating: false,
                        race: editRace
                    };
                    res.render('edit_race', data);
                }
                else {
                    res.render('nav_to', {navLocation: "/"});
                }
            }
            else
            {
                res.render('nav_to', {navLocation:"/"});
            }
        });
    }
    else
    {
        res.render('nav_to', {navLocation:"/"});
    }
});

router.get('/manage', function(req, res) {
    if(req.session.isLoggedIn)
    {
        database.getRaces(req.session.athlete.id, function (err, result) {
            if(!err) {
                var data = {
                    titleText: "Manage Races | ",
                    url : process.env.APP_URL,
                    appName : process.env.APP_NAME,
                    mode: 'race',
                    athlete: req.session.athlete,
                    races: result
                };

                race.UpdateRaces(data);
                res.render('manage', data);
            }
            else
            {
                res.render('nav_to', {navLocation:"/"});
            }
        });
    }
    else
    {
        res.render('nav_to', {navLocation:"/"});
    }
});

router.get('/join', function(req, res) {
    if(req.session.isLoggedIn)
    {
        database.getAthleteRaces(req.session.athlete.id, function (err, joinedRaces)
        {
            if (err)
            {
                res.render('nav_to', {navLocation: "/"});
                return;
            }

            database.getPublicRaces(function (err, result) {
                if (err)
                {
                    res.render('nav_to', {navLocation: "/"});
                    return;
                }

                var data = {
                    titleText: "Join Race | ",
                    url: process.env.APP_URL,
                    appName: process.env.APP_NAME,
                    mode: 'race',
                    athlete: req.session.athlete,
                    races: []
                };

                var currentTime = new Date();
                function filterRace(item)
                {
                    var isJoined = joinedRaces.findIndex(function (joined)
                        {
                            return item._id === joined._id;
                        }) === -1;
                    return (new Date(item.endTime) - currentTime) > 0 && isJoined;
                }

                data.races = data.races.concat(result.filter(filterRace));

                database.getPrivateRaces(req.session.athlete.id, function (err, result)
                {
                    if (err)
                    {
                        res.render('nav_to', {navLocation: "/"});
                        return;
                    }

                    data.races = data.races.concat(result.filter(filterRace));
                    race.UpdateRaces(data);
                    res.render('join', data);
                });

            });
        });
    }
    else
    {
        res.render('nav_to', {navLocation:"/"});
    }
});

router.get('/details/:id', function(req, res) {
    database.getDocument(req.params.id, function (err, editRace)
    {
        if(!err)
        {
            database.getRaceParticipants(req.params.id, function (err, participants)
            {
                if(!err)
                {
                    race.UpdateRaceState(editRace);

                    var maxLat = -180;
                    var minLat = 180;
                    var maxLong = -180;
                    var minLong = 180;
                    editRace.stages.forEach(function (stage)
                    {
                        if(stage.map !== undefined)
                        {
                            var points = polyline.decode(stage.map.polyline);

                            stage.map.points = points;

                            maxLat = Math.max(maxLat, stage.start_latlng[0]);
                            minLat = Math.min(minLat, stage.start_latlng[0]);
                            maxLong = Math.max(maxLong, stage.start_latlng[1]);
                            minLong = Math.min(minLong, stage.start_latlng[1]);

                            maxLat = Math.max(maxLat, stage.end_latlng[0]);
                            minLat = Math.min(minLat, stage.end_latlng[0]);
                            maxLong = Math.max(maxLong, stage.end_latlng[1]);
                            minLong = Math.min(minLong, stage.end_latlng[1]);
                        }
                    });

                    centerLat = (maxLat-minLat)/2 + minLat;
                    centerLong = (maxLong-minLong)/2 + minLong;

                    editRace.centerPoint = [
                        centerLat,
                        centerLong
                    ];

                    editRace.boundingBox = [[
                        minLat,
                        minLong
                    ],[
                        maxLat,
                        maxLong
                    ]];

                    var data = {
                        titleText: editRace.name + " | Race | ",
                        url : process.env.APP_URL,
                        appName : process.env.APP_NAME,
                        mode : 'race',
                        isLoggedIn : req.session.isLoggedIn,
                        athlete : req.session.athlete,
                        user: req.session.user,
                        stravaClientId: process.env.STRAVA_CLIENT_ID,
                        stravaRedirect: process.env.STRAVA_REDIRECT_URI,
                        race : editRace,
                        participants : participants
                    };
                    res.render('details_race', data);
                }
                else
                {
                    res.render('nav_to', {navLocation:"/"});
                }
            });
        }
        else
        {
            res.render('nav_to', {navLocation:"/"});
        }
    });
});

module.exports = router;