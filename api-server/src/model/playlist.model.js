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
        this.subscribedBy = props.subscribedBy;
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

function find(query) {
    return new Promise((resolve, reject) => {
        db.find({
            $or: [
                {author: query.author},
                {subscribedBy: query.author}
            ]
        })
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
        db.findOne({_id: query.id})
            .lean()
            .exec((err, doc) => {
                if (err) return reject(errors.translate(err, 'retrieve playlist information'));
                logger.trace('doc: ', JSON.stringify(doc, null, 4));
                return resolve(new Playlist(doc));
            });
    });
}

function delete_new(playlist) {
    db.remove({ _id: playlist.id },{ justOne: true})
            .lean()
            .exec((err, doc) => {
                if (err) return reject(errors.translate(err, 'delete playlist'));
                logger.trace(JSON.stringify(doc, null, 4));                
                return resolve(doc);
            });
}


module.exports = {
    Playlist,
    find,
    findById,
    merge,
    delete_new
    
};
