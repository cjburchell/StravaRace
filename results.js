"use strict";

var database = require('./database');
var strava = require('strava-v3');
var activity_utils = require('./public/javascripts/activity');
var result_utils = require('./public/javascripts/result');
var array_utils = require('./public/javascripts/array_utils');

function UpdateParticipant(participant, activity, accessToken, done)
{
    var stagesProcessed = 0;

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
        done(true);
        return;
    }

    if(participant.results === undefined)
    {
        participant.results = [];
    }

    participant.results.forEach(function (result)
    {
        var stage = activity.stages.find(function (item)
        {
            return item.segmentId === result.segmentId;
        });

        if(!stage)
        {
            array_utils.remove(participant.results, result);
        }
    });

    activity.stages.forEach(function (stage)
    {
        var result = participant.results.find(function(item){return item.segmentId === stage.segmentId;});
        var oldresultTime = undefined;
        var oldresultActiviy = undefined;
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


        var startUTC = new Date(activity.startTime).getTime();
        var endUTC = new Date(activity.endTime).getTime();

        var startTime = new Date(activity.startTime);
        startTime.setHours(startTime.getHours()-12);

        var endTime = new Date(activity.endTime);
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
                    console.log("ERROR: " + err);
                }
                else
                {
                    efforts = efforts.filter(function (item)
                    {
                        var time = new Date(item.start_date).getTime();
                        return (time >= startUTC) && (time < endUTC)
                    });

                    if(efforts.length !== 0)
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

                }

                stagesProcessed++;
                if(stagesProcessed >= activity.stages.length)
                {
                    var complete = participant.results.filter(item => item.time !== undefined).length;
                    if(participant.stagesComplete === undefined  || participant.stagesComplete !== complete)
                    {
                        participant.stagesComplete = complete;
                        participant.changed = true;
                    }

                    var totalTime = undefined;
                    if(!participant.results.some(result => result.time === undefined))
                    {
                        totalTime = participant.results.reduce((total, item) => total + item.time, 0);
                    }

                    if(participant.time !== totalTime)
                    {
                        participant.time = totalTime;
                        participant.changed = true;
                    }

                    done();
                }
            });
    })
}

function UpdateStandings(participants, activity)
{
    const sexList = ['M', 'F'];

    activity.categories.forEach(function (category)
    {
        sexList.forEach(function (sex)
        {
            var stageParticipants = participants.filter(function (item)
            {
                return item.categoryId === category.id && item.sex == sex;
            });

            var rank = 0;
            stageParticipants.filter(function (item)
            {
                return item.time !== undefined;
            }).sort(function(a, b){return a.time - b.time;}).forEach(function (participant)
            {
                rank++;
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
            stageParticipants.filter(function (item)
            {
                return item.time == undefined;
            }).forEach(function (participant)
            {
                if(participant.rank !== rank)
                {
                    participant.rank = rank;
                    participant.changed = true;
                }
            });
        });
    });
}

function SaveParticipants(participants, done)
{
    var processed = 0;
    var changedItems = participants.filter(function (item) { return item.changed } );
    if(changedItems.length !== 0)
    {
        changedItems.forEach(function (participant)
        {
            participant.changed = undefined;
            database.updateDocument(participant, function (result)
            {
                if (!result)
                {
                    console.log("ERROR: Unable to update Participant %s", participant._id);
                }

                processed++;
                if (processed >= changedItems.length)
                {
                    done(true);
                }
            });
        });
    }
    else
    {
        done(true);
    }
}

class Results
{
    updateActivity(activity, accessToken, done)
    {
        var oldState = activity.state;
        activity_utils.UpdateActivityState(activity);

        if(oldState !== activity.state)
        {
            database.updateDocument(activity, function (result)
            {
                if (!result)
                {
                    console.log("ERROR: Unable to Update Activity, Activity: %s", activity._id);
                }
            });
        }

        if(activity.state != 'upcoming')
        {
            database.getActivityParticipants(activity._id, function (err, participants)
            {
                if (!err)
                {
                    if(participants.length == 0)
                    {
                        done(true);
                    }
                    else
                    {
                        var participantProcessed = 0;
                        participants.forEach(function (participant)
                        {
                            participant.changed = false;
                            UpdateParticipant(participant, activity, accessToken, function ()
                            {
                                participantProcessed++;

                                if (participantProcessed >= participants.length)
                                {
                                    UpdateStandings(participants, activity);
                                    SaveParticipants(participants, done);
                                }
                            });
                        });
                    }
                }
                else
                {
                    console.log("ERROR: Unable to Get Activity Participants, Activity: %s", activity._id);
                    done(false);
                }
            });
        }
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

            participants.forEach(function (item)
            {
                item.changed = false;
            });

            UpdateParticipant(participant, activity, accessToken, function ()
            {
                UpdateStandings(participants, activity);
                SaveParticipants(participants, done);
            });
        });
    });
};

    updateAllActivities(accessToken)
    {

        database.getUpcomingActivities(function (err, activities)
        {
            if (!err)
            {
                activities.forEach(function (activity)
                {
                    this.updateActivity(activity, accessToken, function ()
                    {

                    });
                });
            }
            else
            {
                console.log("ERROR: Unable to Upcoming Activities");
            }
        });

        database.getInProgressActivities(function (err, activities)
        {
            if (!err)
            {
                activities.forEach(function (activity)
                {
                    this.updateActivity(activity, accessToken, function ()
                    {
                    });
                });
            }
            else
            {
                console.log("ERROR: Unable to In Progress Activities");
            }
        });
    };
}

module.exports = new Results();