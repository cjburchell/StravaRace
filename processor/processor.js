/**
 * Created by cjburchell on 2018-08-21.
 */

const results = require('../results');
const log = require('../log/log');
const cron = require('cron');

// every 5 min check the results
const cronJob = cron.job(process.env.POLL_INTERVAL, function(){
    log.debug("Process: Update all activities");
    results.updateAllActivities(process.env.STRAVA_ACCESS_TOKEN);
});
cronJob.start();
