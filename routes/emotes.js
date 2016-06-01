"use strict";

var path = require('path');
var async = require('async');
var _ = require('underscore');
var express = require('express');
var router = express.Router();
var itemsDAO = require('../dao/Items').items;
var emotesDAO = require('../dao/Emotes').emotes;
var imgServerDAO = require('../dao/ImageServer').imgServer;
var multer  = require('multer');
var upload = multer({ dest: '/tmp/' });
// var storage =   multer.diskStorage({
//   destination: function (req, file, callback) {
//     callback(null, './uploads');
//   },
//   filename: function (req, file, callback) {
//     callback(null, file.fieldname + '-' + Date.now());
//   }
// });
// var upload = multer({ storage : storage}).single('userPhoto');
var environments = [ 'development', 'production', 'zain' ];

// get all emotes
router.get('/', (req, res, handleError) => {
    var emotes = {};
    async.forEachSeries(environments, (env, next) => {
        emotesDAO.get(null, env, (err, docs) => {
            if (docs !== undefined) {
                docs.forEach((emote) => {
                    if (!emotes.hasOwnProperty(emote._id)) {
                        emotes[emote._id] = _.clone(emote);
                    }
                    emotes[emote._id][env] = 1;
                });
            }

            return next();
        });
    }, (err) => {
        if (err) handleError(err);
        else res.render('emotes', {
            data: emotes,
            environments: environments
        });
    });
});

// template to enter emote data
router.get('/create', (req, res, handleError) => {
    res.render('createEmote');
});
// template to edit emote data
router.get('/:key', (req, res, handleError) => {
    emotesDAO.get(req.params.key, 'development', (err, data) => {
        if (err) return handleError(err);

        var emote = data[0];
        res.render('editEmote', {
            key: req.params.key,
            alias: emote.alias,
            animated: emote.animated
        });
    });
});

// remove emote from environment
router.delete('/:key', (req, res, handleError) => {
    emotesDAO.remove(req.params.key, req.body.environment, (err, result) => {
        if (err) {
            err.status = 500;
            return handleError(err);
        }
        else res.status(200).send();
    });
});

// create emote in development
router.post('/',
    upload.fields([
        { name: 'emoteImg', maxCount: 1 },
        { name: 'itemImg', maxCount: 1 }
    ]),
    (req, res, handleError) => {
        var premium = (req.body.premium === 'true') ? 1 : 0;
        var animated = (req.body.animated === 'true') ? 1 : 0;

        console.log('received data:', req.body, req.files);
        // req.body
        // {
        //     key: 'test',
        //     alias: ':)',
        //     animated: 'true',
        //     premium: 'false'
        // }
        // req.files
        // {
        //     emoteImg: [{
        //         fieldname: 'emoteImg',
        //         originalname: '2015-07-30 08.55.30.jpg',
        //         encoding: '7bit',
        //         mimetype: 'image/jpeg',
        //         destination: '/tmp/',
        //         filename: '1ee916c89fa2e0c94e0d70858f4a77b7',
        //         path: '/tmp/1ee916c89fa2e0c94e0d70858f4a77b7',
        //         size: 1402975
        //     }],
        //     itemImg: [{
        //         fieldname: 'itemImg',
        //         originalname: '2015-07-30 08.55.30.jpg',
        //         encoding: '7bit',
        //         mimetype: 'image/jpeg',
        //         destination: '/tmp/',
        //         filename: 'b9ccd20dce72f5b240fbcec393c9a4ca',
        //         path: '/tmp/b9ccd20dce72f5b240fbcec393c9a4ca',
        //         size: 1402975
        //     }]
        // }

        var itemData = {
            type: 'emotes',
            properties: {
                allowUseItem: 1,
                limitQuantity: 1,
                canStackInventory: 1
            }
        };
        var itemImage
          , emoteData = {}
          , invalidFields = {};

        async.series([
            // validate the item data
            (next) => {
                if (!premium) return next();

                itemData.name = req.body.name;
                itemData.stringKey = itemData.icon = req.body.key;
                if (req.body.sellPrice)
                    itemData.properties.sellPrice = req.body.sellPrice;
                if (req.body.vcPrice)
                    itemData.properties.vcPrice = req.body.vcPrice;

                if ('itemImg' in req.files)
                    itemImage = req.files.itemImg[0];
                else invalidFields.itemImg = true;
                _validateItemData(itemData, itemImage, (err, fields) => {
                    _.extendOwn(invalidFields, fields);
                    return next(err);
                });
            },
            // validate the emote data
            (next) => {
                if (!req.body.key)
                    invalidFields.key = true;
                if (!req.body.alias)
                    invalidFields.alias = true;
                if (!req.files.emoteImg)
                    invalidFields.emoteImg = true;
                else {
                    var emoteImgData = req.files.emoteImg[0];
                    var filename = path.parse(emoteImgData.originalname).name;
                    if (filename != req.body.key)
                        invalidFields.emoteImg = 'Filename must match the unique key'
                    else if (animated && emoteImgData.mimetype != 'image/gif')
                        invalidFields.emoteImg = 'Must be animated GIF';
                }

                if (Object.keys(invalidFields).length > 0)
                    return next(new Error("Found invalid fields"));

                emoteData = {
                    key: req.body.key,
                    alias: req.body.alias,
                    animated: animated,
                    type: premium ? 'premium' : 'default'
                };

                return next();
            },
            // try to get emote with same key to check for dups
            (next) => {
                var key = req.body.key;
                var alias = req.body.alias;
                emotesDAO.checkDups(key, alias, 'development', (err, docs) => {
                    if (!err) {
                        if (docs.length > 0) err = new Error('Emote key already exists');
                        docs.forEach((doc) => {
                            if (doc._id == key) invalidFields.key = 'Duplicate already exists';
                            if (doc.alias == alias) invalidFields.alias = 'Duplicate already exists';
                        });
                    }
                    return next(err);
                });
            },
            // create new item data
            (next) => {
                if (!premium) return next();
                _createItem(itemData, itemImage, next);
            },
            // create new emote entry
            (next) => {
                emotesDAO.add(emoteData, 'development', next);
            },
            // upload image (gif) to image server emote bucket
            (next) => {
                imgServerDAO.upload('emotes', req.files.emoteImg[0], environments, next);
            }
        ], (err) => {
            if (err) {
                if (Object.keys(invalidFields).length > 0)
                    res.status(400).json(invalidFields);
                else return handleError(err);
            }
            else res.json(req.body);
        });
    }
)

// update emote
router.put('/:key',
    upload.fields([
        { name: 'emoteImg', maxCount: 1 }
    ]),
    (req, res, handleError) => {
        console.log('received data:', req.body, req.files);
        // req.body
        // {
        //     alias: '',
        //     animated: 'true'
        // }
        // req.files
        // {
        //     emoteImg: [{
        //         fieldname: 'emoteImg',
        //         originalname: '2015-07-30 08.55.30.jpg',
        //         encoding: '7bit',
        //         mimetype: 'image/jpeg',
        //         destination: '/tmp/',
        //         filename: '1ee916c89fa2e0c94e0d70858f4a77b7',
        //         path: '/tmp/1ee916c89fa2e0c94e0d70858f4a77b7',
        //         size: 1402975
        //     }]
        // }

        var emoteImage
          , originalData
          , updateData = {}
          , newImage = false
          , key = req.params.key;
        var invalidFields = {};
        async.series([
            // get emote data from db
            (next) => {
                emotesDAO.get(key, 'development', (err, data) => {
                    if (!err) originalData = data;
                    return next(err);
                });
            },
            // validation
            (next) => {
                if ('alias' in req.body) {
                    if (!req.body.alias) invalidFields.alias = true;
                    else updateData.alias = req.body.alias;
                }

                if ('animated' in req.body)
                    updateData.animated = (req.body.animated == 'true') ? 1 : 0;

                if ('emoteImg' in req.files) {
                    var animated = ('animated' in updateData) ?
                        updateData.animated : originalData.animated;
                    var emoteImgData = req.files.emoteImg[0];
                    var filename = path.parse(emoteImgData.originalname).name;
                    if (filename != key)
                        invalidFields.emoteImg = 'Filename must match the unique key'
                    else if (animated && emoteImgData.mimetype != 'image/gif')
                        invalidFields.emoteImg = 'Must be animated GIF';
                    else
                        emoteImage = emoteImgData;
                }

                if (!'alias' in updateData) return next();
                emotesDAO.checkDups(null, updateData.alias, 'development', (err, docs) => {
                    if (!err && docs.length > 0)
                        invalidFields.alias = 'Duplicate already exists';
                    return next(err);
                });
            },
            // throw error if any invalid fields found in previous block
            (next) => {
                var err;
                if (Object.keys(invalidFields).length > 0)
                    err = new Error("Found invalid fields");
                return next(err);
            },
            // update emote
            (next) => {
                if (Object.keys(updateData).length == 0)
                    return next();
                emotesDAO.update(key, updateData, environments, next);
            },
            // upload file
            (next) => {
                if (!emoteImage) return next();
                imgServerDAO.upload('emotes', emoteImage, environments, next);
            }
        ], (err) => {
            if (err) {
                if (Object.keys(invalidFields).length > 0)
                    res.status(400).json(invalidFields);
                else return handleError(err);
            }
            else res.status(200).send({ ACK: 'Success' });
        });
    }
)

function _validateItemData(data, image, callback) {
    var invalidFields = {};

    async.series([
        // make sure needed fields are present
        (next) => {
            if (!data.name)
                invalidFields.name = true;
            if (!data.stringKey)
                invalidFields.stringKey = true;
            if (!data.icon)
                invalidFields.icon = true;
            if (!data.type)
                invalidFields.type = true;
            if (image) {
                var filename = path.parse(image.originalname).name;
                if (filename != data.icon)
                    invalidFields.itemImg = 'Image filename must match the key/icon';
            }

            return next();
        },
        // verify unique constraints
        (next) => {
            if (!data.name) return next();

            itemsDAO.getByName(data.name, (err, result) => {
                if (!err && result.length != 0)
                    invalidFields.name = 'Item name already exists';
                return next(err);
            });
        }
    ], (err) => {
        return callback(err, invalidFields);
    });
}

function _createItem(data, image, callback) {
    async.series([
        // create item and associated properties in the database
        (next) => {
            itemsDAO.add(data, 'development', next);
        },
        // upload image to image server bbw bucket
        (next) => {
            imgServerDAO.upload('bbw', image, environments, next);
        },
    ], callback);
}

module.exports = router;
