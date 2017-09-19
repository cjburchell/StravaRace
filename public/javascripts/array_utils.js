/**
 * Created by Christiaan on 2016-08-09.
 */
(function(exports){

    function Remove(array, item) {
        var  index = array.indexOf(item);
        if (index > -1) {
            array.splice(index, 1);
        }
    }

    exports.remove = Remove;

})(typeof exports === 'undefined'? this.arrayUtils={}: exports);