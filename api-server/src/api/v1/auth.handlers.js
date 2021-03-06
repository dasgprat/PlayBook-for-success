const AuthModel = require('../../model/auth.model');
const UserModel = require('../../model/user.model');
const response = require('./response');
const status = require('http-status');
const logger = require('winstonson')(module);
const security = require('../../util/security');
const { generateUserResponse } = require('./users.handlers');

module.exports = {
    verifyAuthorized,
    login
};

async function login(req, res) {
    try {
        if (!req.body.username || !req.body.password)
            return response.sendErrorResponse(res, status.BAD_REQUEST, 'Missing username and/or password');
        let user = await UserModel.find({ username: req.body.username });
        if (!user)
            return response.sendErrorResponse(
                res,
                status.NOT_FOUND,
                `Could not find user with username '${req.body.username}'`
            );
        let authInfo = await AuthModel.find({ user: user.id });
        if (!authInfo) return response.sendErrorResponse(res, status.NOT_FOUND, 'Failed to authenticate user');
        let hashed = security.hash(authInfo.algo, authInfo.salt, req.body.password);
        if (hashed != authInfo.hash) {
            return response.sendErrorResponse(res, status.BAD_REQUEST, 'Incorrect password');
        }
        // Authentication succeeded, generate a token and return it to the user
        let token = await security.generateToken(req.body.username);
        res.cookie('auth', token);
        let body = generateUserResponse(user);
        return response.sendActionResponse(res, status.OK, 'Successfully authenticated user', { user: body });
    } catch (err) {
        logger.error(err);
        return response.sendErrorResponse(res, err, 'authenticate user');
    }
}

async function verifyAuthorized(req, res) {
    // We should not get to this point unless the request came with a valid authorization token. Just return
    // success
    let user = await UserModel.find({ username: req.user.sub });
    let body = generateUserResponse(user);
    return response.sendQueryResponse(res, status.OK, { user: body });
}
