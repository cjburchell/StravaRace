/**
 * Created by Christiaan on 2016-08-12.
 */
(function(exports){
    exports.User = function User(athleteId) {
        this._id = undefined;
        this._rev = undefined;
        this.type = "user";
        this.athleteId = athleteId;
        this.role = "user";
        this.maxActiveRaces = 3;
    };
})(typeof exports === 'undefined'? this['user']={}: exports);