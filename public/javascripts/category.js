/**
 * Created by Christiaan on 2016-08-08.
 */
(function(exports){
   exports.Category = function Category(id) {
        this.id = id;
        this.name = "";
    }
})(typeof exports === 'undefined'? this['category']={}: exports);
