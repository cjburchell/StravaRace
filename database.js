/**
 * Created by Christiaan on 2016-08-08.
 */

var race = require('./public/javascripts/race');
const NodeCouchDb = require('node-couchdb');

const StravaDatabaseName = "strava_race";
const byOwnerView = "_design/race/_view/by_owner";

const PrivateRacesView = "_design/race/_view/private_races";
const PublicRacesView = "_design/race/_view/public_races";

/**
 * Creates Database Object
 * @return {Object} Database
 */
function Database() {

    var connect = function ()
    {
        return new NodeCouchDb({
            host: process.env.RACE_DB_HOST,
            port: process.env.RACE_DB_PORT,
            protocol: process.env.RACE_DB_PROTOCOL,
            auth:{
                user: process.env.RACE_DB_USER,
                pass: process.env.RACE_DB_PASSWORD
            }
        });
    };

    this.getRace = function (raceId, done) {
        var couch = connect();
        couch.get(StravaDatabaseName, raceId).then( function(data) {
            done(undefined, data.data);
        }, function (err) {
            console.log(err);
            done(err);
        });
    };

    this.getRaces = function (userId, done) {
        var couch = connect();
        var queryOptions = {
            include_docs : true,
            key : userId
        };

        couch.get(StravaDatabaseName, byOwnerView, queryOptions).then( function(data) {
            var docs = data.data.rows.map(function (item) {
                return item.doc});

            done(undefined, docs);
        }, function (err) {
            console.log(err);
            done(err);
        });
    };

    this.getPublicRaces = function (done) {
        var couch = connect();
        var queryOptions = {
            include_docs : true
        };

        couch.get(StravaDatabaseName, PublicRacesView, queryOptions).then( function(data) {
            var docs = data.data.rows.map(function (item) {
                return item.doc});

            done(undefined, docs);
        }, function (err) {
            console.log(err);
            done(err);
        });
    };

    this.getPrivateRaces = function (userId, done) {
        var couch = connect();
        var queryOptions = {
            include_docs : true,
            key : userId
        };

        couch.get(StravaDatabaseName, PrivateRacesView, queryOptions).then( function(data) {
            var docs = data.data.rows.map(function (item) {
                return item.doc});

            done(undefined, docs);
        }, function (err) {
            console.log(err);
            done(err);
        });
    };

    this.updateRace = function (document, done) {
        var couch = connect();
        if(document._id === undefined || document._id === '')
        {
            couch.uniqid().then(function(ids){
                    document._id = ids[0];
                    couch.insert(StravaDatabaseName, document).then(function(data) {
                        done(true, data.data.id);
                    }, function (err) {
                        console.log(err);
                        // either request error occured
                        // ...or err.code=EDOCCONFLICT if document with the same id already exists
                        done(false);
                    });}
                );
        }
        else
        {
            couch.update(StravaDatabaseName, document).then(function(data) {
                done(true, data.data.id);
            }, function (err) {
                console.log(err);
                // either request error occured
                // ...or err.code=EDOCCONFLICT if document with the same id already exists
                done(false);
            });
        }
    };
}

module.exports = new Database();