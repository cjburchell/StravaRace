"use strict";

const database = require('./database/database');
const async = require('async');
const strava = require('strava-v3');
const activity_utils = require('./public/javascripts/activity');
const result_utils = require('./public/javascripts/result');
const array_utils = require('./public/javascripts/array_utils');
const log = require('./log/log');

function UpdateParticipant(participant, activity, accessToken, done)
{
    if(participant.activityState !== activity.state)
    {
        participant.activityState = activity.state;
        participant.changed = true;
    }

    if(participant.activityStartTime !== activity.startTime)
    {
        participant.activityStartTime = activity.state;
        participant.changed = true;
    }

    if(activity.stages.length === 0)
    {
        done();
        return;
    }

    if(participant.results === undefined)
    {
        participant.results = [];
    }

    participant.results.forEach(function (result)
    {
        const stage = activity.stages.find(item => item.segmentId === result.segmentId);

        if(!stage)
        {
            array_utils.remove(participant.results, result);
            participant.changed = true;
        }
    });

    async.each(activity.stages, (stage, callback)=>{
        let result = participant.results.find(item => item.segmentId === stage.segmentId);
        let oldresultTime = undefined;
        let oldresultActiviy = undefined;
        if(!result)
        {
            result = new result_utils.Result(stage.segmentId);
            participant.results.push(result);
            participant.changed = true;
        }
        else
        {

            oldresultTime = result.time;
            oldresultActiviy = result.activityId;
            result.time = undefined;
            result.activityId = undefined;
        }

        if(result.stageNumber === undefined || result.stageNumber !== stage.number)
        {
            result.stageNumber = stage.number;
            participant.changed = true;
        }


        const startUTC = new Date(activity.startTime).getTime();
        const endUTC = new Date(activity.endTime).getTime();

        const startTime = new Date(activity.startTime);
        startTime.setHours(startTime.getHours()-12);

        const endTime = new Date(activity.endTime);
        endTime.setHours(endTime.getHours()+12);

        strava.segments.listEfforts(
            {
                id : stage.segmentId,
                access_token : accessToken,
                start_date_local : startTime.toJSON(),
                end_date_local : endTime.toJSON(),
                athlete_id : participant.athleteId
            }, function (err, efforts)
            {
                if (err)
                {
                    callback(err);
                    return;
                }

                efforts = efforts.filter( item   =>
                {
                    var time = new Date(item.start_date).getTime();
                    return (time >= startUTC) && (time < endUTC)
                });

                if (efforts.length !== 0)
                {
                    var effort = efforts.reduce(function (prev, current)
                    {
                        return (prev.elapsed_time < current.elapsed_time) ? prev : current
                    });
                    if (effort)
                    {
                        result.time = effort.elapsed_time;
                        if (oldresultTime !== effort.elapsed_time)
                        {
                            participant.changed = true;
                        }
                        result.activityId = effort.activity.id;
                        if (oldresultActiviy !== effort.activity.id)
                        {
                            participant.changed = true;
                        }
                    }
                }
                else
                {
                    if (oldresultTime !== undefined)
                    {
                        participant.changed = true;
                    }
                    if (oldresultActiviy !== undefined)
                    {
                        participant.changed = true;
                    }
                }

                callback();
            });
    }, err => {
        if (err)
        {
            log.error(err.toString());
            done(err);
            return;
        }

        if(activity.activityType === 'race' || activity.activityType === 'triathlon')
        {
            var complete = participant.results.filter(item => item.time !== undefined).length;
            if (participant.stagesComplete === undefined || participant.stagesComplete !== complete)
            {
                participant.stagesComplete = complete;
                participant.changed = true;
            }

            var totalTime = undefined;
            if (!participant.results.some(result => result.time === undefined))
            {
                totalTime = participant.results.reduce((total, item) => total + item.time, 0);
            }

            if (participant.time !== totalTime)
            {
                participant.time = totalTime;
                participant.changed = true;
            }
        }

        done();
    });
}

function UpdateStandings(participants, activity)
{
    if (!(activity.activityType === 'race' || activity.activityType === 'triathlon'))
    {
        return;
    }

    const sexList = ['M', 'F'];

    activity.categories.forEach(function (category)
    {
        sexList.forEach(function (sex)
        {
            var stageParticipants = participants.filter(item => item.categoryId === category.id && item.sex === sex);

            var rank = 0;
            var topParticipant = null;
            stageParticipants.filter(item => item.time !== undefined).sort((a, b) => a.time - b.time).forEach(participant =>
            {
                rank++;
                if(topParticipant === null)
                {
                    topParticipant = participant;
                }

                if(participant.rank === undefined || participant.rank !== rank)
                {
                    participant.rank = rank;
                    participant.changed = true;
                }

                if(participant.out_of === undefined || participant.outOf !== rank)
                {
                    participant.out_of = stageParticipants.length;
                    participant.changed = true;
                }
            });

            rank=undefined;
            stageParticipants.filter(item => item.time === undefined).forEach(participant =>
            {
                if(participant.rank !== rank)
                {
                    participant.rank = rank;
                    participant.changed = true;
                }
            });

            stageParticipants.filter(item => item.time !== undefined).forEach(participant =>
            {
                var offsetTime = participant.time - topParticipant.time;
                if(participant.offsetTime === undefined || participant.offsetTime !== offsetTime)
                {
                    participant.offsetTime = offsetTime;
                    participant.changed = true;
                }
            });

            activity.stages.forEach(stage =>{

                var stageRank = 0;
                stageParticipants
                    .map(item => [item.results.find(result => result.segmentId === stage.segmentId), item])
                    .filter(item => item[0].time !== undefined)
                    .sort((a, b) => a[0].time - b[0].time)
                    .forEach(result =>
                {
                    stageRank++;
                    if(result[0].rank === undefined || result[0].rank !== stageRank)
                    {
                        result[0].rank = stageRank;
                        result[1].changed = true;
                    }
                });

                stageRank=undefined;
                stageParticipants.map(item => [item.results.find(result => result.segmentId === stage.segmentId), item]).filter(item => item[0].time === undefined).forEach(result =>
                {
                    if(result[0].rank !== rank)
                    {
                        result[0].rank = rank;
                        result[1].changed = true;
                    }
                });
            });
        });
    });
}

function SaveParticipants(participants, done)
{
    var changedItems = participants.filter(function (item) { return item.changed } );
    if(changedItems.length !== 0)
    {
        async.each(changedItems, function (participant, callback)
        {
            participant.changed = undefined;
            database.updateDocument(participant, callback);
        },done);
    }
    else
    {
        done();
    }
}

class Results
{
    updateActivity(activity, accessToken, done)
    {
        var oldState = activity.state;
        activity_utils.UpdateActivityState(activity);
        async.parallel([callback=>{
            if (oldState !== activity.state)
            {
                database.updateDocument(activity, callback);
            }
            else
            {
                callback();
            }
        },
        callback=>{
            if (activity.state === 'upcoming')
            {
                callback();
                return;
            }

            database.getActivityParticipants(activity._id, function (err, participants)
            {
                if (err)
                {
                    log.error("Unable to Get Activity Participants, Activity: %s", activity._id);
                    callback(err);
                    return;
                }

                if (participants.length === 0)
                {
                    callback();
                    return;
                }

                async.each(participants, (participant, callback1) =>
                    {
                        participant.changed = false;
                        UpdateParticipant(participant, activity, accessToken, callback1);
                    }
                    , err =>
                    {
                        if( err )
                        {
                            callback(err);
                            return;
                        }


                        UpdateStandings(participants, activity);
                        SaveParticipants(participants, callback);
                    });
            });
        }], done);
    }

    updateParticipant(participantId, activityId, accessToken, done)
    {
        database.getDocument(activityId, function (err, activity)
        {
            if (err)
            {
                done(false);
                return;
            }

            database.getActivityParticipants(activityId, function (err, participants)
            {
                if (err)
                {
                    done(false);
                    return;
                }

                var participant = participants.find(function (item)
                {
                    return item._id === participantId;
                });

                if (participant === undefined)
                {
                    return;
                }

                participants.forEach(item => item.changed = false);

                UpdateParticipant(participant, activity, accessToken, () =>
                {
                    UpdateStandings(participants, activity);
                    SaveParticipants(participants, done);
                });
            });
        });
    }

    updateAllActivities(accessToken)
    {
        var results = this;

        async.waterfall([ callback=>{
            database.getUpcomingActivities(function (err, activities)
            {
                if (err)
                {
                    log.error("Unable to Upcoming Activities");
                    callback(err);
                    return;
                }

                async.forEach(activities, (activity, callback1) =>
                {
                    results.updateActivity(activity, accessToken, callback1);
                }, callback);
            });
        },
            callback=>
            {
                database.getInProgressActivities(function (err, activities)
                {
                    if (err)
                    {
                        log.error("Unable to In Progress Activities");
                        callback(err);
                        return;
                    }

                    async.forEach(activities, (activity, callback1) =>
                    {
                        results.updateActivity(activity, accessToken, callback1);
                    }, callback);
                });
            }
        ], err=>{
            if(err)
            {
                log.error("Unable to Update Activities");
            }
        });
    };
}

module.exports = new Results();
