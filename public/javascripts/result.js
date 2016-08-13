/**
 * Created by Christiaan on 2016-08-11.
 */
(function(exports){
    exports.Result = function Stage(segmentId) {
        this.segmentId = segmentId;
        this.time = undefined;
        this.activityId = undefined;
    };
})(typeof exports === 'undefined'? this['result']={}: exports);