"use strict";

var async = require('async');
var mysqlClient = require('../libs/database/MySQL').MySQL;
var mongoClient = require('../libs/database/MongoDB').Mongo;
var Log = global.logger.database;

var staticFuncs = exports.items = {
    getByName: (name, callback) => {
        var options = {
            ns: 'ItemsDAO::getByName',
            connection: 'bbwItem_development',
            sql: 'SELECT * FROM item WHERE name = ?',
            values: [ name ]
        };
        mysqlClient.doQuery(options, callback);
    },

    getItemTypes: (type, callback) => {
        var options = {
            ns: 'ItemsDAO::getItemTypes',
            connection: 'bbwItem_development',
            sql: 'SELECT * FROM itemType'
        };
        if (type) {
            options.sql += ' WHERE name = ?';
            options.values = [ type ];
        }
        mysqlClient.doQuery(options, callback);
    },

    getItemProperties: (properties, callback) => {
        for (var idx = properties.length-1; idx >= 0; idx--) {
            var p = properties[idx];
            properties[idx] = '"' + p + '"';
        }
        var options = {
            ns: 'ItemsDAO::getItemProperties',
            connection: 'bbwItem_development',
            sql: 'SELECT * FROM property WHERE name IN (' + properties.join(',') + ')'
        };
        mysqlClient.doQuery(options, callback);
    },

    addItemProperty: (itemId, propertyId, value, callback) => {
        var options = {
            ns: "ItemsDAO::addItemProperty",
            connection: 'bbwItem_development',
            sql: 'INSERT INTO itemProperty (itemId, propertyId, value, createdAt, createdBy) VALUES (?, ?, ?, NOW(), "bbwtool")',
            values: [ itemId, propertyId, value ]
        };
        mysqlClient.doQuery(options, callback);
    },

    add: (data, environment, callback) => {
        var itemId;

        async.series([
            // get the item type Id
            (next) => {
                if ('itemTypeId' in data) return next();

                staticFuncs.getItemTypes(data.type, (err, result) => {
                    if (!err) data.itemTypeId = result[0].id;
                    return next(err);
                });
            },
            // add the emote item
            (next) => {
                var options = {
                    ns: 'ItemsDAO::add',
                    connection: 'bbwItem_'+environment,
                    sql: 'INSERT INTO item (name, stringKey, icon, itemTypeId, createdAt, createdBy) VALUES (?, ?, ?, ?, NOW(), "bbwtool")',
                    values: [ data.name, data.stringKey, data.icon, data.itemTypeId ]
                };
                mysqlClient.doQuery(options, (err, result) => {
                    if (!err) itemId = result.insertId;
                    return next(err);
                });
            },
            // get the item properties
            (next) => {
                if (!data.hasOwnProperty('properties')) return next();

                staticFuncs.getItemProperties(Object.keys(data.properties), (err, properties) => {
                    if (!err) {
                        properties.forEach((property) => {
                            staticFuncs.addItemProperty(
                                itemId, property.id,
                                data.properties[property.name],
                                () => {}
                            );
                        });
                    }
                    return next(err);
                });
            },
            // enable the item in the development environment
            (next) => {
                staticFuncs.overrideProperty(itemId, 'enabled', 1, environment, next);
            }
        ], (err) => {
            return callback(err, itemId);
        });
    },

    overrideProperty: (itemId, property, value, environment, callback) => {
        var options = {
            ns: 'ItemsDAO:overrideProperty',
            connection: 'bbw_'+environment,
            collection: 'ItemOverrides',
            op: 'update',
            query: { _id: parseInt(itemId) },
            update: { '$set': {} },
            options: { upsert: true }
        };
        options.update['$set'][property] = value;
        mongoClient.doQuery(options, callback);
    }

};
