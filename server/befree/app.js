'use strict';

const config = require('config');
const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB.DocumentClient();

const mysql = require('mysql2');
const pool = mysql.createPool({
    host: config.get('db_config.host'),
    port: config.get('db_config.port'),
    user: config.get('db_config.user'),
    password: config.get('db_config.password'),
    database: config.get('db_config.database')
});
const promisePool = pool.promise();

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

exports.getMatchesHandler = async (event, context, callback) => {
    // try {
    //     var conn = await pool.getConnection();
    //     callback(null, {
    //         statusCode: 200,
    //         body: "hello world"
    //     });

    //     conn.query('')
    // } catch (e) {

    // }
    // console.log(event['pathParameters']);
    // console.log(event["queryStringParameters"]);
    // console.log(event.body);
    try {
        const [rows, fields] = await promisePool.query("SELECT * from matches");

        callback(null, {
            statusCode: 200,
            body: JSON.stringify(rows)
        });
    } catch (e) {
        console.log('get matches failed', e);
    }
}
