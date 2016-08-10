/**
 * Created by Christiaan on 2016-08-08.
 */
(function(exports){
    exports.Participant = function Participant(id, raceId, catagoryId) {
        this.id = id;
        this.raceId = raceId;
        this.catagoryId = catagoryId;
    }
})(typeof exports === 'undefined'? this['participant']={}: exports);
