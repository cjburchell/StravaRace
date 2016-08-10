/**
 * Created by Christiaan on 2016-08-08.
 */
(function(exports){
   exports.Category = function Category(id) {
        this.id = id;
        this.name = "";
        this.ageMode = "all";
        this.ageMax = 100;
        this.ageMin = 0;
        this.sex = "all";
    }
})(typeof exports === 'undefined'? this['category']={}: exports);
