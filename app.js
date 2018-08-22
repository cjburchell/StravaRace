const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');

const routes = require('./routes/indexRoute');
const activity = require('./routes/activityRoute');
const strava = require('./routes/stravaRoute');
const user = require('./routes/userRoute');
const data = require('./routes/dataRoute');
const update = require('./routes/updateRoute');

const log = require('./log/log');

const app = express();

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
app.use('/activity', activity);
app.use('/strava', strava);
app.use('/user', user);
app.use('/data', data);
app.use('/update', update);

app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist')); // redirect bootstrap
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist')); // redirect jQuery
app.use('/angular', express.static(__dirname + '/node_modules/angular')); // redirect angular
app.use('/mapbox', express.static(__dirname + '/node_modules/mapbox/dist')); // redirect Map Box
app.use('/chartjs', express.static(__dirname + '/node_modules/chart.js/dist')); // redirect chart.js
app.use('/angular-chart', express.static(__dirname + '/node_modules/angular-chart.js/dist')); // redirect chart.js
app.use('/angular-ui-bootstrap', express.static(__dirname + '/node_modules/angular-ui-bootstrap/dist')); // redirect angular-ui-bootstrap
app.use('/angular-animate', express.static(__dirname + '/node_modules/angular-animate')); // redirect angular-animate
app.use('/moment', express.static(__dirname + '/node_modules/moment')); // redirect angular-animate

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
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

module.exports = app;
