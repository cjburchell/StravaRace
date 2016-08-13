/**
 * Created by Christiaan on 2016-08-08.
 */
var express = require('express');
var database = require('../database');
var race = require('../public/javascripts/race');
var category = require('../public/javascripts/category');
var router = express.Router();

function createGuid()
{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

router.get('/create', function(req, res) {
    if(req.session.isLoggedIn)
    {
        var newRace = new race.Race();
        race.ownerId = req.session.athlete.id;
        var newCat = new category.Category(createGuid());
        newCat.name = "Open";
        newRace.categories.push(newCat);
        var data = {
            mode : 'race',
            athlete : req.session.athlete,
            isCreating : true,
            race : newRace
        };
        res.render('edit_race', data);
    }
    else
    {
        res.render('nav_to', {navLocation:"/"});
    }
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
                        mode: 'race',
                        athlete: req.session.athlete,
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
        database.getPublicRaces(function (err, result) {
            if(!err) {
                var data = {
                    mode: 'race',
                    athlete: req.session.athlete,
                    races: []
                };
                var currentTime = new Date();

                function filterRace(item) {
                    if((new Date(item.endTime) - currentTime) > 0)
                    {
                        data.races.push(item);
                    }
                }

                result.forEach(filterRace);

                database.getPrivateRaces(req.session.athlete.id, function (err, result) {
                    if(!err)
                    {
                        result.forEach(filterRace);

                        race.UpdateRaces(data);

                        res.render('join', data);
                    }else
                    {
                        res.render('nav_to', {navLocation:"/"});
                    }
                });
            }else
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
                    var data = {
                        mode : 'race',
                        isLoggedIn : req.session.isLoggedIn,
                        athlete : req.session.athlete,
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