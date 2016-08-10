/**
 * Created by Christiaan on 2016-08-08.
 */

(function(exports){
    exports.Race = function Race() {
        this._id = "";
        this.ownerId = ""
        this.name = "";
        this.description = "";
        this.startTime = new Date();
        this.endTime = new Date();
        this.endTime.setDate(this.startTime.getDate() + 1);
        this.privaicy = "public";
        this.categories = [];
        this.stages = [];
    }
})(typeof exports === 'undefined'? this['race']={}: exports);