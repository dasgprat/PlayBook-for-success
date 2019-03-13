const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const apiRouter = express.Router();
const passport = require('passport');
const security = require('../../util/security');
const users = require('./users.routes');
const auth = require('./auth.routes');
const playlist = require('./playlist.routes');
const category = require('./category.routes');

security.createPassportStrategy((err, strategy) => {
    if (err) throw new Error('Failed to create passport strategy: ' + err.message);
    passport.use(strategy);
    apiRouter.use(bodyParser.json());
    apiRouter.use(cookieParser());
    apiRouter.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE');
        next();
    });

    let prefix = '/api/v1';

    // For the auth and user routes, not all of them should be authenticated. Otherwise we won't be able to login or
    // add a new user
    apiRouter.use(prefix, auth);
    apiRouter.use(prefix, users);
    apiRouter.use(prefix, playlist);
    apiRouter.use(prefix, category);

    // Error handling for any uncaught errors or errors thrown by middleware
    apiRouter.use(prefix, (err, req, res, next) => {
        console.log(err);
        next(err);
    });
});

module.exports = apiRouter;
