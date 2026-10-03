var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const MongoClient = require('mongodb').MongoClient;

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));

app.use(function (req, res, next) {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

MongoClient.connect('mongodb://enoislove:enoislife1337@stonksexchange-db/')
  .then(async (client) => {
    app.locals.db = client.db();
    await app.locals.db.collection('users').createIndex({
      username: 1
    });
    await app.locals.db.collection('messages').createIndex({
      username: 1,
      _id: -1
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', { title: 'Error' });
});

module.exports = app;
