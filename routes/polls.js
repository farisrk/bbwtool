"use strict";

var path = require('path');
var async = require('async');
var _ = require('underscore');
var express = require('express');
var router = express.Router();
var itemsDAO = require('../dao/Items').items;
var pollsDAO = require('../dao/Polls').polls;
var environments = [ 'development', 'production', 'zain' ];

// get all emotes
router.get('/', (req, res, handleError) => {
    var environment = req.query.environment || 'production';
    pollsDAO.get(null, environment, (err, polls) => {
        if (err) return handleError(err)
        else res.render('polls', {
            data: polls,
            environments: environments
        });
    });
});

//// template to enter emote data
//router.get('/create', (req, res, handleError) => {
//    res.render('createEmote');
//});
//
//
//// add emote to environment
//router.put('/:key', (req, res, handleError) => {
//    var data = {
//        key: req.params.key,
//        alias: req.body.alias,
//        type: req.body.type,
//        animated: req.body.animated || 0
//    };
//    emotesDAO.add(data, req.body.environment, (err, result) => {
//        if (err) {
//            res.status(500).json({
//                code: 500,
//                message: err.message
//            });
//        }
//        else res.status(200).send();
//    });
//});
//
//// remove emote from environment
//router.delete('/:key', (req, res, handleError) => {
//    emotesDAO.remove(req.params.key, req.body.environment, (err, result) => {
//        if (err) {
//            err.status = 500;
//            return handleError(err);
//        }
//        else res.status(200).send();
//    });
//});
//
//// create emote in development
//router.post('/',
//    upload.fields([
//        { name: 'emoteImg', maxCount: 1 },
//        { name: 'itemImg', maxCount: 1 }
//    ]),
//    (req, res, handleError) => {
//        req.body.animated = req.body.animated === 'true' ? true : false;
//        req.body.premium = req.body.premium === 'true' ? true : false;
//
//        // console.log('received data:', req.body, req.file, req.files);
//        // req.body
//        // {
//        //     uniqueKey: 'test',
//        //     alias: '',
//        //     animated: 'true',
//        //     premium: 'false'
//        // }
//        // req.files
//        // {
//        //     emoteImg: [{
//        //         fieldname: 'emoteImg',
//        //         originalname: '2015-07-30 08.55.30.jpg',
//        //         encoding: '7bit',
//        //         mimetype: 'image/jpeg',
//        //         destination: '/tmp/',
//        //         filename: '1ee916c89fa2e0c94e0d70858f4a77b7',
//        //         path: '/tmp/1ee916c89fa2e0c94e0d70858f4a77b7',
//        //         size: 1402975
//        //     }],
//        //     itemImg: [{
//        //         fieldname: 'itemImg',
//        //         originalname: '2015-07-30 08.55.30.jpg',
//        //         encoding: '7bit',
//        //         mimetype: 'image/jpeg',
//        //         destination: '/tmp/',
//        //         filename: 'b9ccd20dce72f5b240fbcec393c9a4ca',
//        //         path: '/tmp/b9ccd20dce72f5b240fbcec393c9a4ca',
//        //         size: 1402975
//        //     }]
//        // }
//
//        var itemData = {
//            properties: {
//                allowUseItem: 1,
//                canStackInventory: 1,
//                limitQuantity: 1
//            }
//        };
//        var emoteData = {};
//        var invalidFields = {};
//
//        async.series([
//            // validation
//            (next) => {
//
//                if (!req.body.uniqueKey) invalidFields.uniqueKey = 'Required';
//                    //return next(errorObj.field = 'uniqueKey');
//                if (!req.body.alias) invalidFields.alias = 'Required';
//                    //return next(new Error("Missing the emote alias!"));
//                if (!req.files.emoteImg) invalidFields.emoteImg = 'Required';
//                    // return next(new Error("Missing the emote image!"));
//                else {
//                    var emoteImgData = req.files.emoteImg[0];
//                    var filename = path.parse(emoteImgData.originalname).name;
//                    if (filename != req.body.uniqueKey) invalidFields.emoteImg = 'Filename must match the unique key'
//                    else if (req.body.animated && emoteImgData.mimetype != 'image/gif')
//                        invalidFields.emoteImg = 'Must be animated GIF';
//                    // return next(new Error("Emote image type needs to be a GIF!"));
//                }
//                if (req.body.premium) {
//                    if (!req.files.itemImg) invalidFields.itemImg = 'Required';
//                        // return next(new ERROR("Missing the item image!"));
//                    else {
//                        var filename = path.parse(req.files.itemImg[0].originalname).name;
//                        if (filename != req.body.uniqueKey) invalidFields.emoteImg = 'Filename must match the unique key'
//                    }
//                    if (!req.body.itemName) invalidFields.itemName = 'Required';
//                        // return next(new ERROR("Missing the item name!"));
//                }
//
//                if (Object.keys(invalidFields).length > 0)
//                    return next(new Error("Found invalid fields"));
//
//                itemData.stringKey = itemData.icon = emoteData.key = req.body.uniqueKey;
//                emoteData.alias = req.body.alias;
//                emoteData.animated = req.body.animated ? 1 : 0;
//                emoteData.type = req.body.premium ? 'premium' : 'default';
//
//                if (req.body.premium) {
//                    itemData.name = req.body.itemName;
//                    if (req.body.sellPrice) itemData.sellPrice = req.body.sellPrice;
//                    if (req.body.vcPrice) itemData.vcPrice = req.body.vcPrice;
//                }
//
//                return next();
//            },
//            // try to get emote with same key to check for dups
//            (next) => {
//                var key = req.body.uniqueKey;
//                var alias = req.body.alias;
//                emotesDAO.checkDups(key, alias, 'development', (err, docs) => {
//                    if (!err) {
//                        if (docs.length > 0) err = new Error('Emote key already exists');
//                        docs.forEach((doc) => {
//                            if (doc._id == key) invalidFields.uniqueKey = 'Duplicate already exists';
//                            if (doc.alias == alias) invalidFields.alias = 'Duplicate already exists';
//                        });
//                    }
//                    return next(err);
//                });
//            },
//            // create new item data
//            (next) => {
//                if (!req.body.premium) return next();
//                // TODO: check if item already exists
//                itemsDAO.createEmoteItem(itemData, next);
//            },
//            // upload image (png) to image server bbw bucket
//            (next) => {
//                if (!req.body.premium) return next();
//                imgServerDAO.upload('bbw', req.files.itemImg[0], environments, next);
//            },
//            // create new emote entry
//            (next) => {
//                emotesDAO.add(emoteData, 'development', next);
//            },
//            // upload image (gif) to image server emote bucket
//            (next) => {
//                imgServerDAO.upload('emotes', req.files.emoteImg[0], environments, next);
//            }
//        ], (err) => {
//            if (err) {
//                if (Object.keys(invalidFields).length > 0)
//                    res.status(400).json(invalidFields);
//                else return handleError(err);
//            }
//            else res.json(req.body);
//        });
//    }
//)

module.exports = router;
