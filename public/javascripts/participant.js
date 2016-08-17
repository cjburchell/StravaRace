/**
 * Created by Christiaan on 2016-08-08.
 */
(function(exports){
    exports.Participant = function Participant(athleteId, activityId, categoryId) {
        this._id = undefined;
        this.type = 'participant';
        this.athleteId = athleteId;
        this.athleteImage = "";
        this.activityId = activityId;
        this.activityState = "upcoming";
        this.categoryId = categoryId;
        this.results = [];
        this.name = "";
        this.sex = "";
        this.time = undefined;
        this.rank = undefined;
        this.out_of = undefined;
        this.stagesComplete = undefined;
    }
})(typeof exports === 'undefined'? this['participant']={}: exports);
