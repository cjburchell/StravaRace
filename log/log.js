/**
 * Created by cjburchell on 2018-07-14.
 */

const moment = require('moment');
const nats = require('nats');

class Level {
    constructor (text, severity) {
        this.text = text;
        this.severity = severity
    };
}

class LogMessage{
    constructor(text, level, serviceName, time){
        this.text = text;
        this.level = level;
        this.serviceName = serviceName;
        this.time = time;
    }

    toString(){
        return `[${this.level.text}] ${this.time} ${this.serviceName} - ${this.text}`
    }
}

const DEBUG = new Level("Debug", 0);
const INFO = new Level("Info", 1);
const WARNING = new Level("Warning", 2);
const ERROR = new Level("Error", 3);
const FATAL = new Level("Fatal", 4);

const serviceName = process.env.LOG_SERVICE_NAME || "";
const minLogLevel = parseInt(process.env.LOG_LEVEL) || INFO.Severity;
const logToConsole = process.env.LOG_CONSOLE != undefined? JSON.parse(process.env.LOG_CONSOLE): true;
const natsUrl = process.env.NATS_URL || "tcp://nats:4222";
const connection = nats.connect({url: natsUrl});

function processLog(text, level) {
    const message = new LogMessage(text,level, serviceName, moment.utc().valueOf());

    if (level.severity >= minLogLevel && logToConsole) {
        console.log(message.toString())
    }

    connection.publish(
        "logs",
        message
    );
}

class Log
{
    warn(text){
        processLog(text, WARNING);
    }

    error(text){
        processLog(text, ERROR);
    }

    debug(text){
        processLog(text, DEBUG);
    }

    print(text){
        processLog(text, INFO);
    }

    fatal(text){
        processLog(text, FATAL);
        process.exit(1);
    }
}


module.exports = new Log();
