'use strict';

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient();

exports.commentHandler = (event, context, callback) => {
    callback(null, {
        statusCode: 200,
        body: "hello world"
    });
}

exports.betHandler = (event, context, callback) => {
    callback(null, {
        statusCode: 200,
        body: "hello world"
    });
}

exports.likeHandler = (event, context, callback) => {
    callback(null, {
        statusCode: 200,
        body: "hello world"
    });
}

exports.matchDetailHandler = (event, context, callback) => {
    callback(null, {
        statusCode: 200,
        body: "hello world"
    });
}

exports.getMatchesHandler = (event, context, callback) => {
    callback(null, {
        statusCode: 200,
        body: "hello world"
    });
}