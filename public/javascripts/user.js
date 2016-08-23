/**
 * Created by Christiaan on 2016-08-12.
 */
(function(exports){
    exports.User = function User(athleteId, name) {
        this._id = undefined;
        this._rev = undefined;
        this.type = "user";
        this.athleteId = athleteId;
        this.role = "user";
        this.maxActiveActivities = 3;
        this.name = name;
    };
})(typeof exports === 'undefined'? this['user']={}: exports);