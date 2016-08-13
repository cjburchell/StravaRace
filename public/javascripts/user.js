/**
 * Created by Christiaan on 2016-08-12.
 */
(function(exports){
    exports.User = function User(athleteId) {
        this._id = undefined;
        this._rev = undefined;
        this.type = "user";
        this.athleteId = athleteId;
        this.isAdmin = false;
    };
})(typeof exports === 'undefined'? this['user']={}: exports);