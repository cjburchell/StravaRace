/**
 * Created by Christiaan on 2016-08-23.
 */
class PageData
{
    constructor(titleText, session)
    {
        this.appName = process.env.APP_NAME;
        this.url = process.env.APP_URL;
        this.fbAppId = process.env.FB_APP_ID;
        this.stravaClientId = process.env.STRAVA_CLIENT_ID;
        this.stravaRedirect = process.env.STRAVA_REDIRECT_URI;
        this.mapboxToken = process.env.MAPBOX_TOKEN;
        this.titleText = titleText;
        this.isActivity = false;

        if (session)
        {
            this.isLoggedIn = session.isLoggedIn;
            this.isFacebookLoggedIn = session.isFacebookLoggedIn;
            this.isStravaLoggedIn = session.isStravaLoggedIn;
            this.athlete = session.athlete;
            this.user = session.user;
        }
        else
        {
            this.isLoggedIn = false;
        }
    }
}

module.exports = PageData;