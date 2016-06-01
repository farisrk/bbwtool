"use strict";

var fs = require('fs');
var async = require('async');
var httpClient = require('../libs/Http').Http;
var Log = global.logger.http;

var staticFuncs = exports.imgServer = {
    upload: (bucket, data, environments, callback) => {
        if (Object.prototype.toString.call(environments) !== '[object Array]')
            environments = [ environments ];

        async.forEachSeries(environments, (env, next) => {
            // zain environment does not have its own image server
            if (env == 'zain') return next();

            var options = {
                ns: 'ImageServer::upload',
                connection: 'imgServer_'+env,
                request: {
                    uri: '/upload', method: 'POST',
                    json: false, timeout: 5000,
                    formData: {
                        app: bucket,
                        numFiles: 1,
                        upload0: {
                            value: fs.createReadStream(data.path),
                            options: {
                                filename: data.originalname,
                                contentType: data.mimetype
                            }
                        }
                    }
                }
            };
            httpClient.doRequest(options, next);
        }, (err) => {
            if (err) Log.debug('[ImageServer::upload] File upload failed!', err);
            return callback(err);
        });
    }
};
