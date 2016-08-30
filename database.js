/**
 * Created by Christiaan on 2016-08-08.
 */
"use strict";
const NodeCouchDb = require('node-couchdb');

const StravaDatabaseName = "strava_race";

const ActivitybyOwnerView = "_design/activity/_view/by_owner";

const PrivateActivitiesView = "_design/activity/_view/private_activities";
const PublicActivitiesView = "_design/activity/_view/public_activities";

const ParticipantbyActivityView = "_design/participant/_view/by_activity";
const ActivitybyParticipantView = "_design/activity/_view/by_participant";

const CommentsbyActivityView = "_design/comments/_view/by_activity";

const UpcomingActivitiesView = "_design/activity/_view/upcoming_activities";
const InProgressActivitiesView = "_design/activity/_view/inprogress_activities";

const UpcomingActivitybyParticipantView = "_design/activity/_view/upcoming_by_participant";
const InProgressActivitybyParticipantView = "_design/activity/_view/inprogress_by_participant";
const FinishedActivitybyParticipantView = "_design/activity/_view/finished_by_participant";

const UpcomingByOwner ="_design/activity/_view/upcoming_by_owner";

const FinishedActivities ="_design/participant/_view/finished";
const RankActivities = "_design/participant/_view/rank";

const userView = "_design/user/_view/by_athlete";
const fbUserView = "_design/user/_view/by_fb_id";


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

/**
 * Creates Database Object
 * @return {Object} Database
 */
class Database
{
    getDocument(id, done) {
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

    getView(key, view, done, descending, limit, reduce = false)
    {
        console.log("DB: getView"+ " key:" +  key + " view: " + view);
        var couch = connect();

        var include_docs = !reduce;
        var queryOptions = {
            include_docs : include_docs,
            key : key,
            descending: descending,
            limit: limit,
            reduce: reduce
        };

        couch.get(StravaDatabaseName, view, queryOptions).then( function(data) {
            try
            {
                if(!include_docs)
                {
                    done(undefined, undefined, data.data.rows);
                    return;
                }

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

    getActivities(ownerId, done) {
        this.getView(ownerId, ActivitybyOwnerView, done);
    };

    getAthleteActivities(athleteId, done)
    {
        this.getView(athleteId, ActivitybyParticipantView, done);
    };

    getUpcomingAthleteActivities(athleteId, done)
    {
        this.getView(athleteId, UpcomingActivitybyParticipantView, done);
    };

    getInProgressAthleteActivities(athleteId, done)
    {
        this.getView(athleteId, InProgressActivitybyParticipantView, done);
    };

    getFinishedAthleteActivities(athleteId, done)
    {
        this.getView(athleteId, FinishedActivitybyParticipantView, done, false, 5);
    };

    getActivityParticipants(activityId, done)
    {
        this.getView(activityId, ParticipantbyActivityView, done, undefined, undefined, false);
    };

    getActivityComments(activityId, done)
    {
        this.getView(activityId, CommentsbyActivityView, done);
    };

    getCount(key, view, done)
    {
        this.getView(key, view, function (err, docs, values)
        {
            if(err)
            {
                done(err);
                return;
            }

            if(values.length !== 0)
            {
                done(undefined,values[0].value);
            }
            else
            {
                done(undefined,0);
            }
        }, undefined, undefined, true);
    }

    getActivityParticipantsCount(activityId, done)
    {
        this.getCount(activityId, ParticipantbyActivityView, done);
    };

    getCreatedUpcomingCount(ownerId, done)
    {
        this.getCount(ownerId, UpcomingByOwner, done);
    };

    getFinishedCount(athleteId, done)
    {
        this.getCount(athleteId, FinishedActivities, done);
    };

    getFirstPlaceCount(athleteId, done)
    {
        this.getCount([athleteId,1], RankActivities, done);
    };

    getSecondPlaceCount(athleteId, done)
    {
        this.getCount([athleteId,2], RankActivities, done);
    };

    getThirdPlaceCount(athleteId, done)
    {
        this.getCount([athleteId,3], RankActivities, done);
    };

    getPublicActivities(done)
    {
        this.getView(undefined, PublicActivitiesView, done);
    };

    getPrivateActivities(userId, done)
    {
        this.getView(userId, PrivateActivitiesView, done);
    };

    getUpcomingActivities(done)
    {
        this.getView(undefined, UpcomingActivitiesView, done);
    };

    getInProgressActivities(done) {
        this.getView(undefined, InProgressActivitiesView, done);
    };

    updateDocument(document, done)
    {
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
                                done(undefined, data.data.id);
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
                                done(error);
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
                    done(undefined, data.data.id);
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

    deleteDocument(id, rev, done)
    {
        console.log("DB: deleteDocument"+ " Id:" +  id + " rev:" +  rev);
        var couch = connect();
            couch.del(StravaDatabaseName, id, rev).then(function()
            {
                try
                {
                    done();
                }
                catch (error)
                {
                    console.log("ERROR: " + error);
                    console.log(error.stack);
                    done(error);
                }
            }, function (err)
            {
                try
                {
                    console.log("ERROR: " + err);
                    // either request error occured
                    // ...or err.code=EDOCCONFLICT if document with the same id already exists
                    done(err);
                }
                catch (error)
                {
                    console.log("ERROR: " + error);
                    console.log(error.stack);
                    done(error);
                }
            });
    };

    getUser(athleteId, done)
    {
        this.getView(athleteId, userView, function (err, users)
        {
            if(err)
            {
                done(err);
            }
            else
            {
                done(err, users[0]);
            }
        });
    }

    getFBUser(facebookId, done)
    {
        this.getView(facebookId, fbUserView, function (err, users)
        {
            if (err)
            {
                done(err);
            }
            else
            {
                done(err, users[0]);
            }
        });
    };
}

module.exports = new Database();