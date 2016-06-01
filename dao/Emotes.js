"use strict";

var async = require('async');
var mongoClient = require('../libs/database/MongoDB').Mongo;
var Log = global.logger.database;

var staticFuncs = exports.emotes = {
    checkDups: (key, alias, environment, callback) => {
        var query = {};
        if (key && alias)
            query = { '$or': [{ _id: key }, { alias: alias }] };
        else if (key)
            query['_id'] = key;
        else
            query['alias'] = alias;
        var options = {
            ns: 'EmotesDAO:getEmote',
            connection: 'bbw_'+environment,
            collection: 'Emotes',
            op: 'find',
            query: query
        };
        mongoClient.doQuery(options, callback);
    },

    get: (key, environment, callback) => {
        var options = {
            ns: 'EmotesDAO:get',
            connection: 'bbw_'+environment,
            collection: 'Emotes',
            op: 'find',
            query: {},
            sort: { '$natural': -1 }
        };
        if (key) options.query._id = key;
        mongoClient.doQuery(options, callback);
    },

    add: (data, environments, callback) => {
        if (Object.prototype.toString.call(environments) !== '[object Array]')
            environments = [ environments ];

        async.forEachSeries(environments, (env, next) => {
            var options = {
                ns: 'EmotesDAO:add',
                connection: 'bbw_'+env,
                collection: 'Emotes',
                op: 'insert',
                data: {
                    _id: data.key,
                    alias: data.alias,
                    type: data.type,
                    animated: parseInt(data.animated)
                },
                options: { safe: true }
            };
            mongoClient.doQuery(options, next);
        }, (err) => {
            if (err) Log.debug('[EmotesDAO::add] Failed to add emote!', err);
            return callback(err);
        });
    },

    update: (key, data, environments, callback) => {
        if (Object.prototype.toString.call(environments) !== '[object Array]')
            environments = [ environments ];

        async.forEachSeries(environments, (env, next) => {
            var options = {
                ns: 'EmotesDAO:update',
                connection: 'bbw_'+env,
                collection: 'Emotes',
                op: 'update',
                query: { _id: key },
                update: { '$set': data },
                options: { safe: true }
            };
            mongoClient.doQuery(options, next);
        }, (err) => {
            if (err) Log.debug('[EmotesDAO::update] Failed to update emote!', err);
            return callback(err);
        });
    },

    remove: (key, environment, callback) => {
        var options = {
            ns: 'EmotesDAO:remove',
            connection: 'bbw_'+environment,
            collection: 'Emotes',
            op: 'remove',
            query: { _id: key }
        };
        mongoClient.doQuery(options, callback);
    }


};
