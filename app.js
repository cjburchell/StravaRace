var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');

var routes = require('./routes/indexRoute');
var race = require('./routes/raceRoute');
var strava = require('./routes/stravaRoute');
var user = require('./routes/userRoute');
var data = require('./routes/dataRoute');
var update = require('./routes/updateRoute');

var results = require('./results');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session(
    {
      secret: 'StravaRace-1dc7c275-1156-4e50-a5e1-e68654da3029',
      resave: false,
      saveUninitialized: true
    }));

app.use('/', routes);
app.use('/race', race);
app.use('/strava', strava);
app.use('/user', user);
app.use('/data', data);
app.use('/update', update);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


if(process.env.POLL_INTERVAL !== "0")
{
    setInterval(function ()
    {
        console.log("THREAD: Update all races");
        results.updateAllRaces(process.env.STRAVA_ACCESS_TOKEN);
    }, process.env.POLL_INTERVAL);
}


module.exports = app;
