const jwt = require('jsonwebtoken');
const fs = require('fs');
const config = require('config');
const path = require('path');
const { PlaybookError, ErrorCodes } = require('./error');
const { Strategy } = require('passport-jwt');
const passport = require('passport');
const crypto = require('crypto');
const response = require('../api/v1/response');
const logger = require('winstonson')(module);

let _config = config.get('security');
let _key = path.join(process.cwd(), _config.jwt.secretKey);
let _secret = null;
let _issuer = _config.jwt.issuer;
let _audience = _config.jwt.audience;

function _retrieveSecret(cb) {
    fs.readFile(_key, 'utf8', (err, secret) => {
        if (err) return cb(new PlaybookError(ErrorCodes.F_FILE_FAILURE, 'Failed to read secret: ' + err.message));
        _secret = secret;
        cb();
    });
}

function initializeAuthorization(cb) {
    _createPassportStrategy((err, strategy) => {
        if (err) cb(new Error('Failed to create passport strategy: ' + err.message));
        passport.use(strategy);
        cb();
    });
}

function _createPassportStrategy(cb) {
    if (!_secret) {
        _retrieveSecret(err => {
            if (err) return cb(err);
            let strategy = _generateStrategy();
            return cb(null, strategy);
        });
    } else {
        let strategy = _generateStrategy();
        return cb(null, strategy);
    }
}

function _generateStrategy() {
    return new Strategy(
        {
            jwtFromRequest: function(req) {
                let token = null;
                if (req && req.cookies) {
                    token = req.cookies.auth;
                }
                return token;
            },
            issuer: _issuer,
            audience: _audience,
            secretOrKey: _secret
        },
        (payload, done) => {
            // Will appear on 'req' as 'user'
            done(null, payload);
        }
    );
}

function authorize(req, res, next) {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            logger.error(err);
            return response.sendErrorResponse(res, 500, 'Failed to authorize request');
        }
        if (!user) {
            return response.sendErrorResponse(res, 401, 'Unauthorized request');
        }
        req.user = user;
        next();
    })(req, res, next);
}

function generateToken(subject) {
    let payload = {
        iss: _issuer,
        sub: subject,
        aud: _audience,
        exp: Math.floor(Date.now() / 1000) + 60 * 60
    };
    return new Promise((resolve, reject) => {
        if (!_secret) {
            _retrieveSecret(err => {
                if (err) return reject(err);
                jwt.sign(payload, _secret, (err, token) => {
                    if (err) return reject(err);
                    return resolve(token);
                });
            });
        } else {
            jwt.sign(payload, _secret, (err, token) => {
                if (err) return reject(err);
                return resolve(token);
            });
        }
    });
}

function verifyToken(token, subject, audience) {
    return new Promise((resolve, reject) => {
        fs.readFile(_key, 'utf8', (err, secret) => {
            if (err)
                return reject(new PlaybookError(ErrorCodes.F_FILE_FAILURE, `Failed to read secret: ${err.message}`));
            let options = { subject, audience, issuer: _issuer };
            jwt.verify(token, secret, options, (err, decoded) => {
                if (err)
                    return reject(
                        new PlaybookError(ErrorCodes.A_AUTH_TOKEN_FAILURE, `Failed to validate token: ${err.message}`)
                    );
                return resolve(decoded);
            });
        });
    });
}

function hash(algo, salt, password) {
    return crypto
        .createHash(algo)
        .update(salt)
        .update(password)
        .digest('hex');
}

module.exports = {
    generateToken,
    verifyToken,
    initializeAuthorization,
    authorize,
    hash
};
