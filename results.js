var database = require('./database');
var strava = require('strava-v3');
var race_utils = require('./public/javascripts/race');
var result_utils = require('./public/javascripts/result');
var array_utils = require('./public/javascripts/array_utils');

function Results()
{
    function UpdateParticipant(participant, race, accessToken, done)
    {
        var stagesProcessed = 0;

        if(participant.raceState !== race.state)
        {
            participant.raceState = race.state;
            participant.changed = true;
        }

        if(participant.raceStartTime !== race.startTime)
        {
            participant.raceStartTime = race.state;
            participant.changed = true;
        }

        if(race.stages.length === 0)
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
            var stage = race.stages.find(function (item)
            {
                return item.segmentId === result.segmentId;
            });

            if(!stage)
            {
                array_utils.remove(participant.results, result);
            }
        });

        race.stages.forEach(function (stage)
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

            var startUTC = new Date(race.startTime).getTime();
            var endUTC = new Date(race.endTime).getTime();

            var startTime = new Date(race.startTime);
            startTime.setHours(startTime.getHours()-12);

            var endTime = new Date(race.endTime);
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
                if(stagesProcessed >= race.stages.length)
                {
                    var complete = participant.results.filter(function (item) {return item.time !== undefined;}).length;
                    if(participant.stagesComplete === undefined  || participant.stagesComplete !== complete)
                    {
                        participant.stagesComplete = complete;
                        participant.changed = true;
                    }

                    var totalTime = undefined;
                    if(!participant.results.some(function (result)
                        {
                            return result.time === undefined;
                        }))
                    {
                        var totalTime = participant.results.reduce(function (total, item) {
                            return total + item.time;
                        }, 0);
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

    function UpdateStandings(participants, race)
    {
        const sexList = ['M', 'F'];

        race.categories.forEach(function (category)
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

    function UpdateRaceState(race, accessToken, done)
    {
        var oldState = race.state;
        race_utils.UpdateRaceState(race);

        if(oldState !== race.state)
        {
            database.updateDocument(race, function (result)
            {
                if (!result)
                {
                    console.log("ERROR: Unable to Update Race, Race: %s", race._id);
                }
            });
        }

        if(race.state != 'upcomming')
        {
            database.getRaceParticipants(race._id, function (err, participants)
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
                            UpdateParticipant(participant, race, accessToken, function ()
                            {
                                participantProcessed++;

                                if (participantProcessed >= participants.length)
                                {
                                    UpdateStandings(participants, race);
                                    SaveParticipants(participants, done);
                                }
                            });
                        });
                    }
                }
                else
                {
                    console.log("ERROR: Unable to Get Race Participants, Race: %s", race._id);
                    done(false);
                }
            });
        }
    }

    this.updateParticipant = function(participantId, raceId, accessToken, done){
        database.getDocument(raceId, function (err, race)
        {
            if (err)
            {
                done(false);
                return;
            }

            database.getRaceParticipants(raceId, function (err, participants)
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

                UpdateParticipant(participant, race, accessToken, function ()
                {
                    UpdateStandings(participants, race);
                    SaveParticipants(participants, done);
                });
            });
        });
    };

    this.updateRace = UpdateRaceState;

    this.updateAllRaces = function(accessToken){

        database.getUpcommingRaces(function (err, races)
        {
            if (!err)
            {
                races.forEach(function (race)
                {
                    UpdateRaceState(race, accessToken, function ()
                    {

                    });
                });
            }
            else
            {
                console.log("ERROR: Unable to Upcoming Races");
            }
        });

        database.getInProgressRaces(function (err, races)
        {
            if (!err)
            {
                races.forEach(function (race)
                {
                    UpdateRaceState(race, accessToken, function ()
                    {
                    });
                });
            }
            else
            {
                console.log("ERROR: Unable to In Progress Races");
            }
        });
    };
}

module.exports = new Results();