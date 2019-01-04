'use strict';

const moment = require('moment');
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

exports.commentHandler = async (event, context, callback) => {
    // console.log('event', event);
    // console.log('context', context);

    const username = event.requestContext.authorizer.claims['cognito:username'];

    var body = JSON.parse(event.body);

    console.log('req body', event.body, 'user', username);

    try {
        var params = {
            TableName: 'Comment',
            Item: {
                "MatchId": body.matchId,
                'User': username,
                "Content": body.content,
                'Likes': 0,
                'Created': moment().unix()
            }
        };

        var res = await ddb.put(params).promise();

        console.log('ddb add comment res', res);

        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Request-Method': 'POST, GET, OPTIONS, DELETE, OPTION, PUT',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
            },
            statusCode: 200,
            body: '{"code":0}'
        };
    } catch (e) {
        console.log('write comment failed', e)
    }
}

exports.betHandler = async (event, context, callback) => {

}

exports.likeHandler = async (event, context, callback) => {
    var body = JSON.parse(event.body);

    console.log('like comment req body', body, 'headers', event.headers['Origin']);

    try {
        var params = {
            TableName: 'Comment',
            Key: {
                "MatchId": body.matchId,
                "User": body.user
            },
            UpdateExpression: "set Likes = Likes + :val",
            ExpressionAttributeValues: {
                ":val": 1
            },
            ReturnValues: "UPDATED_NEW"
        };

        var result = await ddb.update(params).promise();

        console.log('like comment result', result);

        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Request-Method': 'POST, GET, OPTIONS, DELETE, OPTION, PUT',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
            },
            statusCode: 200,
            body: '{"code":0}'
        };
    } catch (e) {
        console.log('like comment failed', e)
    }
}

exports.matchDetailHandler = async (event, context, callback) => {
    var matchId = parseInt(event["queryStringParameters"]['id']);

    console.log('match detail id', matchId);

    var match;

    try {
        const [rows, fields] = await promisePool.query("SELECT * from matches where id = ?", [matchId]);

        rows.forEach(element => {
            match = element;
        });

        console.log('get match', match);

        var params = {
            TableName: "Comment",
            KeyConditionExpression: "#id = :matchId",
            ExpressionAttributeNames: {
                "#id": "MatchId"
            },
            ExpressionAttributeValues: {
                ":matchId": matchId
            }
        };

        var result = await ddb.query(params).promise();

        console.log(result.Count, 'comments found for match', matchId);

        return {
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            statusCode: 200,
            body: JSON.stringify({
                comments: result.Items,
                match: match
            })
        };
    } catch (e) {
        console.log('get match detail failed', e);
    }
}

exports.getMatchesHandler = async (event, context, callback) => {
    try {
        // TODO date_time constraint on SQL
        const [rows, fields] = await promisePool.query("SELECT * from matches");

        console.log('get', rows.length, 'matches');

        return {
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            statusCode: 200,
            body: JSON.stringify(rows)
        };
    } catch (e) {
        console.log('get matches failed', e);
    }
}
