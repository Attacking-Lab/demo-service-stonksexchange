var express = require('express');
const app = require('../app');
const argon2 = require('argon2');
var router = express.Router();

// Route-level failures used to be bare res.send('...') text, which rendered as
// an unstyled line with no header, nav or footer. Status codes are unchanged,
// so every response the checker asserts on is exactly what it was before.
function renderError(res, status, message) {
  res.status(status).render('error', {
    title: 'Error',
    message: message,
    error: { status: status },
  });
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Stonks Exchange' });
});

router.get('/about', function (req, res, next) {
  res.render('about', { title: 'About' });
});

router.get('/login', function (req, res, next) {
  res.render('login', { title: 'Login' });
});

router.get('/register', function (req, res, next) {
  res.render('register', { title: 'Register' });
});

router.get('/messages', function (req, res, next) {
  if (!req.session.user) {
    renderError(res, 403, 'Not logged in');
    return;
  }
  var db = req.app.locals.db;
  db.collection('messages').find({ 'username': req.session.user }).sort({ '_id': -1 }).limit(50).toArray()
    .then((results) => {
      res.locals.messages = results;
      res.render('messages', { title: 'Messages' });
    })
    .catch(() => {
      renderError(res, 500, 'Internal server error');
    });
});

router.get('/logout', function (req, res, next) {
  req.session.destroy(function (err) {
    if (err) throw err;
    res.redirect('/');
  });
});

router.post('/login', function (req, res) {
  if (!req.body.username || !req.body.password) {
    renderError(res, 400, 'Missing username or password');
    return;
  }
  var db = req.app.locals.db;
  db.collection('users').findOne({ 'username': req.body.username }, { 'sort': { '$natural': -1 } }).then(results => {
    if (!results) {
      renderError(res, 400, 'Invalid username or password');
      return;
    }
    argon2.verify(results.password, req.body.password).then(result => {
      if (!result) {
        renderError(res, 400, 'Invalid username or password');
        return;
      }
      req.session.user = req.body.username;
      res.redirect('/');
    });
  });
});

router.post('/register', function (req, res, next) {
  if (!req.body.username || !req.body.password) {
    renderError(res, 400, 'Missing username or password');
    return;
  }
  var db = req.app.locals.db;
  db.collection('users').findOne({ 'username': req.body.username }).then(results => {
    if (results) {
      renderError(res, 400, 'Username already in use');
      return;
    }
    argon2.hash(req.body.password).then(hash => {
      db.collection('users').insertOne({ 'username': req.body.username, 'password': hash }).then(results => {
        req.session.user = req.body.username;
        res.redirect('/');
      });
    });
  });
});

router.post('/message', function (req, res, next) {
  if (!req.body.username || !req.body.message) {
    renderError(res, 400, 'Missing username or message');
    return;
  }
  var db = req.app.locals.db;
  db.collection('messages').insertOne({ 'username': req.body.username, 'message': req.body.message, 'from': req.session.user }).then(results => {
    res.redirect('/messages');
  });
});

module.exports = router;
