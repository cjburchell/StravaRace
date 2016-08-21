/**
 * Created by Christiaan on 2016-08-21.
 */
"use strict";

class Comment
{
    constructor(text, athleteId, athleteImage, name, activityId, time)
    {
        this.type = "comment";
        this.text = text;
        this.athleteId = athleteId;
        this.athleteImage = athleteImage;
        this.name = name;
        this.activityId = activityId;
        this.time = time;
    }
}

module.exports = Comment;
