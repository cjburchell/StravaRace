/**
 * Created by Christiaan on 2016-08-08.
 */

(function(exports){
    exports.Activity = function Activity() {
        this._id = undefined;
        this.type = 'activity';
        this.activityType = "group_ride";
        this.ownerId = "";
        this.name = "";
        this.description = "";
        this.startTime = new Date();
        this.endTime = new Date();
        this.endTime.setDate(this.startTime.getDate() + 1);
        this.totalDistance = 0;
        this.duration = 0;
        this.timeLeft = 0;
        this.privaicy = "public";
        this.categories = [];
        this.stages = [];
        this.state = "upcoming";
        this.maxParticipants = 20;
    };

    exports.UpdateActivityState = function(activity)
    {
        activity.totalDistance = activity.stages.reduce(function (total, item) {
            return total + item.distance;
        }, 0);

        var endTime = new Date(activity.endTime);
        var startTime = new Date(activity.startTime);
        activity.startsIn = startTime - Date.now();
        activity.duration = endTime - startTime;
        activity.timeLeft = endTime - Date.now();
        if(activity.timeLeft <= 0)
        {
            activity.state = 'finished';
        }
        else if(activity.startsIn <= 0)
        {
            activity.state = 'in_progress';
        }
        else
        {
            activity.state = 'upcoming';
        }
    };

    exports.UpdateActivities = function(data)
    {
        data.activities.forEach(exports.UpdateActivityState);

        data.isActivityFinished = data.activities.some(function (item)
        {
            return item.state === 'finished';
        });

        data.isActivityInProgress = data.activities.some(function (item)
        {
            return item.state === 'in_progress';
        });

        data.isActivityUpcoming = data.activities.some(function (item)
        {
            return item.state === 'upcoming';
        });
    };


})(typeof exports === 'undefined'? this['activity_utils']={}: exports);