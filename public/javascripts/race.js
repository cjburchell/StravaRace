/**
 * Created by Christiaan on 2016-08-08.
 */

(function(exports){
    exports.Race = function Race() {
        this._id = undefined;
        this.type = 'race';
        this.ownerId = "";
        this.name = "";
        this.description = "";
        this.startTime = new Date();
        this.endTime = new Date();
        this.endTime.setDate(this.startTime.getDate() + 1);
        this.totalDistance = 0;
        this.duration = 0;
        this.timeLeft = 0;
        this.privaicy = "friends";
        this.categories = [];
        this.stages = [];
        this.state = "upcomming",
        this.maxParticipants = 20
    };

    exports.UpdateRaceState = function(race)
    {
        race.totalDistance = race.stages.reduce(function (total, item) {
            return total + item.distance;
        }, 0);

        var endTime = new Date(race.endTime);
        var startTime = new Date(race.startTime);
        race.startsIn = startTime - Date.now();
        race.duration = endTime - startTime;
        race.timeLeft = endTime - Date.now();
        if(race.timeLeft <= 0)
        {
            race.state = 'finished';
        }
        else if(race.startsIn <= 0)
        {
            race.state = 'in_progress';
        }
        else
        {
            race.state = 'upcomming';
        }
    };

    exports.UpdateRaces = function(data)
    {
        data.races.forEach(exports.UpdateRaceState);

        data.isRaceFinished = data.races.some(function (item)
        {
            return item.state === 'finished';
        });

        data.isRaceInProgress = data.races.some(function (item)
        {
            return item.state === 'in_progress';
        });

        data.isRaceUpcomming = data.races.some(function (item)
        {
            return item.state === 'upcomming';
        });
    };


})(typeof exports === 'undefined'? this['race_utils']={}: exports);