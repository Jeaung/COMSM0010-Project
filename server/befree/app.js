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

exports.commentHandler = async (event) => {
    // console.log('event', event);
    // console.log('context', context);
    if (event['detail-type'] == 'Scheduled Event') {
        console.log('warmed');
        return 'warmed';
    }

    const username = event.requestContext.authorizer.claims['cognito:username'];

    var body = JSON.parse(event.body);

    console.log('req body', event.body, 'user', username);

    var created = moment().unix();
    try {
        var params = {
            TableName: 'Comment',
            Item: {
                "MatchId": body.matchId,
                'User': username,
                "Content": body.content,
                'Likes': 0,
                'Created': created
            },
            ExpressionAttributeNames: {
                "#MatchId": "MatchId",
                "#User": "User"
            },
            ConditionExpression: "attribute_not_exists(#MatchId) AND attribute_not_exists(#User)"
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
            body: JSON.stringify({
                code: 0,
                timestamp: created
            })
        };
    } catch (e) {
        console.log('write comment failed', e)
        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Request-Method': 'POST, GET, OPTIONS, DELETE, OPTION, PUT',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
            },
            statusCode: 500,
            body: JSON.stringify({
                err: e.message
            })
        };
    }
}

exports.betHandler = async (event) => {
    if (event['detail-type'] == 'Scheduled Event') {
        console.log('warmed');
        return 'warmed';
    }

    const username = event.requestContext.authorizer.claims['cognito:username'];
    var body = JSON.parse(event.body);

    var match_id = body.matchId;
    var userBetPoints = body.betPoints;
    var score_predicted = body.scorePredicted;

    console.log('req body', event.body, 'user', username);

    var dateTime_bet = moment().unix();
    console.log('got time and date of bet ', dateTime_bet);
    var return_value;

    try {
        var dateTime_match;
        const [rows, fields] = await promisePool.query('SELECT * FROM matches WHERE id = ?', [match_id]);

        if (rows.length > 0) {
            rows.forEach(element => {
                dateTime_match = element.date_time;
            });
            console.log('got time and date of match ', dateTime_match);
            var diffInSecs;

            if (dateTime_match < dateTime_bet) {
                diffInSecs = dateTime_bet - dateTime_match;
                console.log('the user tried to bet after the match started. The difference in seconds is ', diffInSecs);
                return_value = "The match has already started. You can't bet anymore."

            } else {
                diffInSecs = dateTime_match - dateTime_bet;
                console.log('the bet was made before the match. The difference in seconds is ', diffInSecs);

                var userCrtPoints;
                const [rows2, fields2] = await promisePool.query('SELECT * from rankings where username = ?', [username]);

                if (rows2.length > 0) {
                    rows2.forEach(element => {
                        userCrtPoints = element.bet_points;
                    });
                    console.log('got the number of points of the user ', userCrtPoints);
                    var diffInPoints = userCrtPoints - userBetPoints;

                    if (diffInPoints >= 0) {
                        // add bet
                        var resultInsert = await promisePool.query("INSERT INTO bets (username, match_id, bet_value, score_predicted, date_time) VALUES (?, ?, ?, ?, ?)", [username, match_id, userBetPoints, score_predicted, dateTime_bet]);
                        console.log('inserted into table the bet', resultInsert);

                        // update points
                        var resultReplace = await promisePool.query("UPDATE rankings SET bet_points = ? WHERE username = ?", [diffInPoints, username]);
                        console.log('updated the bet points of the user', resultReplace);

                        return_value = "Your bet was registered. In the case your bet is correct, you will receive your points in less than 24 hours.";
                    } else {
                        console.log('the user has presently less points than he wants to bet');
                        return_value = "You cannot bet more points than you have.";
                    }

                } else {
                    console.log('couldnt find the user number of points')
                    return_value = "An error occured about your account."
                }
            }
        } else {
            console.log('couldnt find match to bet on')
            return_value = "An error occured about this match"
        }
        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Request-Method': 'POST, GET, OPTIONS, DELETE, OPTION, PUT',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
            },
            statusCode: 200,
            body: JSON.stringify({
                return_value: return_value
            })
        };
    } catch (e) {
        console.log('add bet details failed', e);
    }
}

exports.getUserBettingPoints = async (event) => {
    if (event['detail-type'] == 'Scheduled Event') {
        console.log('warmed');
        return 'warmed';
    }

    var username = event["queryStringParameters"]['username'];
    console.log('user', username);
    var betPoints;

    try {
        const [rows, fields] = await promisePool.query("SELECT * from rankings where username = ?", [username]);

        if (rows.length > 0) {
            rows.forEach(element => {
                betPoints = element.bet_points;
            });
            console.log('got betting points', betPoints);

        } else {
            console.log('username is not present in table. Lets initialize his number of points');
            var initBettingPoints = 20;
            var result = await promisePool.query("INSERT INTO rankings (username, bet_points) VALUES (?, ?)", [username, initBettingPoints]);
            console.log('inserted into table result', result);

            const [rows2, fields2] = await promisePool.query("SELECT * from rankings where username = ?", [username]);

            rows2.forEach(element => {
                betPoints = element.bet_points;
            });

            console.log('inserted and got betting points', betPoints);
        }

        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Request-Method': 'POST, GET, OPTIONS, DELETE, OPTION, PUT',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
            },
            statusCode: 200,
            body: JSON.stringify({
                betPoints: betPoints
            })
        };
    } catch (e) {
        console.log('get betting details failed', e);
    }
}

exports.getRankings = async (event) => {
    if (event['detail-type'] == 'Scheduled Event') {
        console.log('warmed');
        return 'warmed';
    }

    var username = event["queryStringParameters"]['username'];
    console.log('user', username);
    var userRanking = { result: "", rank: 0, username: "", bet_points: 0 };
    var k;

    try {
        var [rows, fields] = await promisePool.query("SELECT @rn:=@rn+1 AS rank, username, bet_points FROM (SELECT username, bet_points FROM rankings ORDER BY bet_points DESC LIMIT 20)z, (SELECT @rn:=0)y");

        if (rows.length > 0) {
            console.log('got rankings points', rows);

            var [rows2, fields2] = await promisePool.query("SELECT rank, username, bet_points FROM (SELECT @rn:=@rn+1 AS rank, username, bet_points FROM (SELECT username, bet_points FROM rankings ORDER BY bet_points DESC)z, (SELECT @rn:=0)y) AS T WHERE username = ?", [username]);

            if (rows2.length > 0) {
                rows2.forEach(element => {
                    userRanking.rank = element.rank;
                    userRanking.username = element.username;
                    userRanking.bet_points = element.bet_points;
                });
                console.log('got rankings points of user', userRanking);
            } else {
                userRanking.result = "You are not ranked yet.";
                console.log('could not find user in the database');
            }
        } else {
            userRanking = null;
            console.log('the rankings selection sent an empty result');
        }

        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Request-Method': 'POST, GET, OPTIONS, DELETE, OPTION, PUT',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
            },
            statusCode: 200,
            body: JSON.stringify({
                rankings: rows,
                userRanking: userRanking
            })
        };
    } catch (e) {
        console.log('get rankings failed', e);
    }
}

exports.likeHandler = async (event) => {
    if (event['detail-type'] == 'Scheduled Event') {
        console.log('warmed');
        return 'warmed';
    }

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

exports.matchDetailHandler = async (event) => {
    if (event['detail-type'] == 'Scheduled Event') {
        console.log('warmed');
        return 'warmed';
    }

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
            IndexName: "CommentSI",
            KeyConditionExpression: "#id = :matchId",
            ExpressionAttributeNames: {
                "#id": "MatchId"
            },
            ExpressionAttributeValues: {
                ":matchId": matchId
            },
            ScanIndexForward: false
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
        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Request-Method': 'POST, GET, OPTIONS, DELETE, OPTION, PUT',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
            },
            statusCode: 500,
            body: JSON.stringify({
                err: e.message
            })
        };
    }
}

exports.getMatchesHandler = async (event) => {
    if (event['detail-type'] == 'Scheduled Event') {
        console.log('warmed');
        return 'warmed';
    }

    try {
        // TODO date_time constraint on SQL
        const [rows, fields] = await promisePool.query("SELECT * FROM matches ORDER BY date_time DESC");

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
        return {
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            statusCode: 500,
            body: JSON.stringify({
                err: e.message
            })
        };
    }
}
