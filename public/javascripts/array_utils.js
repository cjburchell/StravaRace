/**
 * Created by Christiaan on 2016-08-09.
 */
(function(exports){
    exports.remove = function Category(array, item) {
        var  index = array.indexOf(item);
        if (index > -1) {
            array.splice(index, 1);
        }
    }
})(typeof exports === 'undefined'? this['arrayUtils']={}: exports);