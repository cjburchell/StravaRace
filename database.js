/**
 * Created by Christiaan on 2016-08-08.
 */

var race = require('./public/javascripts/race');
const NodeCouchDb = require('node-couchdb');

const StravaDatabaseName = "strava_race";
const RacebyOwnerView = "_design/race/_view/by_owner";

const PrivateRacesView = "_design/race/_view/private_races";
const PublicRacesView = "_design/race/_view/public_races";

const ParticipantbyRaceView = "_design/participant/_view/by_race";
const RacebyParticipantView = "_design/race/_view/by_participant";

const UpcommingRacesView = "_design/race/_view/upcomming_races";
const InProgressRacesView = "_design/race/_view/inprogress_races";

const UpcommingRacebyParticipantView = "_design/race/_view/upcomming_by_participant";
const InProgressRacebyParticipantView = "_design/race/_view/inprogress_by_participant";
const FinishedRacebyParticipantView = "_design/race/_view/finished_by_participant";

const userView = "_design/user/_view/by_athlete";

/**
 * Creates Database Object
 * @return {Object} Database
 */
function Database() {

    function connect()
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
    }

    this.getDocument = function (id, done) {
        console.log("DB: getDocument " + id);
        var couch = connect();
        couch.get(StravaDatabaseName, id).then( function(data) {
            try
            {
                done(undefined, data.data);
            }
            catch (error)
            {
                console.log("ERROR: " + error);
                console.log(error.stack);
            }
        }, function (err) {
            try
            {
                console.log("ERROR: getDocument " + err);
                done(err);
            }
            catch (error)
            {
                console.log("ERROR: " + error);
                console.log(error.stack);
            }
        });
    };

    this.getView = function (key, view, done, descending, limit)
    {
        console.log("DB: getView"+ " key:" +  key + " view: " + view);
        var couch = connect();
        var queryOptions = {
            include_docs : true,
            key : key,
            descending: descending,
            limit: limit
        };

        couch.get(StravaDatabaseName, view, queryOptions).then( function(data) {
            try
            {
                var docs = data.data.rows.filter(function (item)
                {
                    return item.doc !== null;
                }).map(function (item) {
                return item.doc});

                var values = data.data.rows.filter(function (item)
                {
                    return item.doc !== null;
                });

                done(undefined, docs, values);
            }
            catch (error)
            {
                console.log("ERROR: " + error);
                console.log(error.stack);
            }
        }, function (err) {
            console.log("ERROR: " + err);
            done(err);
        });
    };

    this.getRaces = function (ownerId, done) {
        this.getView(ownerId, RacebyOwnerView, done);
    };

    this.getAthleteRaces = function (athleteId, done)
    {
        this.getView(athleteId, RacebyParticipantView, done);
    };

    this.getUpcommingAthleteRaces = function (athleteId, done)
    {
        this.getView(athleteId, UpcommingRacebyParticipantView, done);
    };

    this.getInProgressAthleteRaces = function (athleteId, done)
    {
        this.getView(athleteId, InProgressRacebyParticipantView, done);
    };

    this.getFinishedAthleteRaces = function (athleteId, done)
    {
        this.getView(athleteId, FinishedRacebyParticipantView, done, false, 5);
    };

    this.getRaceParticipants = function (raceId, done)
    {
        this.getView(raceId, ParticipantbyRaceView, done);
    };

    this.getPublicRaces = function (done) {
        this.getView(undefined, PublicRacesView, done);
    };

    this.getPrivateRaces = function (userId, done) {
        this.getView(userId, PrivateRacesView, done);
    };

    this.getUpcommingRaces = function (done) {
        this.getView(undefined, UpcommingRacesView, done);
    };

    this.getInProgressRaces = function (done) {
        this.getView(undefined, InProgressRacesView, done);
    };

    this.updateDocument = function (document, done) {
        console.log("DB: updateDocument"+ " Id:" +  document._id + " Type:" +  document.type);
        var couch = connect();
        if(document._id === undefined || document._id === '')
        {
            couch.uniqid().then(function(ids)
                {
                    try
                    {
                        document._id = ids[0];
                        couch.insert(StravaDatabaseName, document).then(function(data)
                        {
                            try
                            {
                                done(true, data.data.id);
                            }
                            catch (error)
                            {
                                console.log("ERROR: " + error);
                                console.log(error.stack);
                            }
                        }, function (err)
                        {
                            try
                            {
                                console.log("ERROR: " + err);
                                // either request error occured
                                // ...or err.code=EDOCCONFLICT if document with the same id already exists
                                done(false);
                            }
                            catch (error)
                            {
                                console.log("ERROR: " + error);
                                console.log(error.stack);
                            }
                        });
                    }
                    catch (error)
                    {
                        console.log("ERROR: " + error);
                        console.log(error.stack);
                    }
                });
        }
        else
        {
            couch.update(StravaDatabaseName, document).then(function(data)
            {
                try
                {
                    done(true, data.data.id);
                }
                catch (error)
                {
                        console.log("ERROR: " + error);
                    console.log(error.stack);
                }
        }, function (err)
            {
                try
                {
                    console.log("ERROR: " + err);
                    // either request error occured
                    // ...or err.code=EDOCCONFLICT if document with the same id already exists
                    done(false);
                }
                catch (error)
                {
                    console.log("ERROR: " + error);
                    console.log(error.stack);
                }
            });
        }
    };

    this.deleteDocument = function (id, rev, done) {
        console.log("DB: deleteDocument"+ " Id:" +  id + " rev:" +  rev);
        var couch = connect();
            couch.del(StravaDatabaseName, id, rev).then(function()
            {
                try
                {
                    done(true);
                }
                catch (error)
                {
                    console.log("ERROR: " + error);
                    console.log(error.stack);
                }
            }, function (err)
            {
                try
                {
                    console.log("ERROR: " + err);
                    // either request error occured
                    // ...or err.code=EDOCCONFLICT if document with the same id already exists
                    done(false);
                }
                catch (error)
                {
                    console.log("ERROR: " + error);
                    console.log(error.stack);
                }
            });
    };

    this.getUser = function (athleteId, done)
    {
        this.getView(athleteId, userView, function (result, users)
        {
            if(!result)
            {
                done(result, users[0]);
            }
            else
            {
                done(result, users);
            }
        });
    };
}

module.exports = new Database();