/**
 * Created by Christiaan on 2016-08-12.
 */
class User
{
    constructor(athleteId, name, facebookId, email)
    {
        this._id = undefined;
        this._rev = undefined;
        this.type = "user";
        this.athleteId = athleteId;
        this.facebookId = facebookId;
        this.role = "user";
        this.maxActiveActivities = 3;
        this.name = name;
        this.email = email;
    }
}

module.exports = User;