/**
 * Created by Christiaan on 2016-08-09.
 */
var express = require('express');
var router = express.Router();

router.get('/history', function(req, res) {
    if(req.session.isLoggedIn)
    {
        var data = {
            mode : 'race',
            athlete : req.session.athlete,
            races : []
        };
        res.render('history', data);
    }
    else
    {
        res.render('nav_to', {navLocation:"/"});
    }
});

module.exports = router;