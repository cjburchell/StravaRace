/**
 * Created by Christiaan on 2016-08-08.
 */
(function(exports){
    exports.Participant = function Participant(athleteId, raceId, categoryId) {
        this._id = undefined;
        this.type = 'participant';
        this.athleteId = athleteId;
        this.raceId = raceId;
        this.categoryId = categoryId;
        this.results = [];
        this.name = "";
        this.sex = "";
    }
})(typeof exports === 'undefined'? this['participant']={}: exports);
