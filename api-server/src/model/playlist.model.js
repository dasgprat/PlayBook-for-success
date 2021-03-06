const uuid = require('uuid/v4');
const db = require('./db/playlist.db');
const errors = require('../util/error');
const logger = require('winstonson')(module);

class Playlist {
    constructor(props) {
        if (!props) props = {};
        this.id = props.id || props._id || uuid();
        this.name = props.name;
        this.author = props.author;
        this.description = props.description;
        this.categories = props.categories;
        this.links = props.links;
        this.personal = props.personal;
        this.subscribedBy = props.subscribedBy || [];
        this.likedBy = props.likedBy || [];
    }
}

function merge(playlist) {
    return new Promise((resolve, reject) => {
        db.findOneAndUpdate({ _id: playlist.id }, playlist, { upsert: true, new: true })
            .lean()
            .exec((err, doc) => {
                if (err) return reject(errors.translate(err, 'save playlist'));
                logger.trace(JSON.stringify(doc, null, 4));
                if (!doc) {
                    return resolve(undefined);
                }
                return resolve(new Playlist(doc));
            });
    });
}

function generateSearchQuery(query, userId) {
    if (query && Object.keys(query).length > 0) {
        if (query.suggest && query.suggest.length > 0) {
            return {
                $or: [
                    {
                        $and: [
                            { personal: false },
                            { author: { $ne: userId } },
                            { subscribedBy: { $ne: userId } },
                            {
                                $or: [
                                    { name: new RegExp(query.search, 'i') },
                                    { categories: new RegExp(query.search, 'i') },
                                    { description: new RegExp(query.search, 'i') }
                                ]
                            }
                        ]
                    }
                ]
            };
        }

        if (query.search && query.search.length > 0) {
            return {
                $or: [
                    {
                        $and: [
                            { personal: false },
                            { author: { $ne: userId } },
                            {
                                $and: [
                                    { personal: false },
                                    { author: { $ne: userId } },
                                    {
                                        $or: [
                                            { name: new RegExp(query.search, 'i') },
                                            { categories: new RegExp(query.search, 'i') },
                                            { description: new RegExp(query.search, 'i') }
                                        ]
                                    }
                                ]
                            }                            
                        ]
                    },
                    {
                        $and: [
                            { author: userId },
                            {
                                $or: [
                                    { name: new RegExp(query.search, 'i') },
                                    { categories: new RegExp(query.search, 'i') },
                                    { description: new RegExp(query.search, 'i') }
                                ]
                            }
                        ]
                    }
                ]
            };
        }
    }

    if (query.subscribedBy && query.subscribedBy.length > 0) {
        return { subscribedBy: userId };
    }

    if (query.likedBy && query.likedBy.length > 0) {
        return { likedBy: userId };
    }
    return {
        $or: [{ author: userId }, { subscribedBy: userId }]
};


    
}

function find(query, userId) {
    return new Promise((resolve, reject) => {
        db.find(generateSearchQuery(query, userId))
            .limit(20)
            .populate('author', 'id name username')
            .populate('categories', 'id name')
            .lean()
            .exec((err, docs) => {
                if (err) return reject(errors.translate(err, 'retrieve playlists'));
                logger.trace(JSON.stringify(docs, null, 4));
                return resolve(docs.map(doc => new Playlist(doc)));
            });
    });
}

function findById(query) {
    logger.trace(`playlist id: ${query.id}`);
    return new Promise((resolve, reject) => {
        db.findOne({ _id: query.id })
            .populate('author', 'id name username')
            .populate('categories', 'id name')
            .lean()
            .exec((err, doc) => {
                if (err) return reject(errors.translate(err, 'retrieve playlist information'));
                logger.trace('doc: ', JSON.stringify(doc, null, 4));
                return resolve(new Playlist(doc));
            });
    });
}

function deletePlaylistUser(query) {
    return new Promise((resolve, reject) => {
        db.remove({ _id: query.id })
            .lean()
            .exec((err, res) => {
                if (err) return reject(errors.translate(err, 'delete playlist'));
                logger.trace(JSON.stringify(res, null, 4));
                return resolve(JSON.stringify(res, null, 4));
            });
    });
}

function findSubscribedPlaylistsForUser(userId) {
    return new Promise((resolve, reject) => {
        db.find({ subscribedBy: userId })
            .lean()
            .exec((err, docs) => {
                if (err) return reject(errors.translate(err, 'retrieve subscribed playlists'));
                return resolve(docs.map(doc => new Playlist(doc)));
            });
    });
}

function findPlaylistsLikedByUser(userId) {
    return new Promise((resolve, reject) => {
        db.find({ likedBy: userId })
            .lean()
            .exec((err, docs) => {
                if (err) return reject(errors.translate(err, 'retrieve liked playlists'));
                return resolve(docs.map(doc => new Playlist(doc)));
            });
    });
}

module.exports = {
    Playlist,
    find,
    findById,
    merge,
    deletePlaylistUser,
    findSubscribedPlaylistsForUser,
    findPlaylistsLikedByUser
};
