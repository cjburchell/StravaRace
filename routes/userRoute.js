/**
 * Created by Christiaan on 2016-08-09.
 */
var express = require('express');
var router = express.Router();
var database = require('../database');

router.get('/history', function(req, res) {
    if(req.session.isLoggedIn)
    {
        database.getAthleteRaces(req.session.athlete.id, function (err, races)
        {
            if(!err)
            {
                var data = {
                    mode : 'race',
                    athlete : req.session.athlete,
                    races : races
                };
                res.render('history', data);
            }
            else
            {
                res.render('nav_to', {navLocation:"/"});
            }
        })
    }
    else
    {
        res.render('nav_to', {navLocation:"/"});
    }
});

module.exports = router;