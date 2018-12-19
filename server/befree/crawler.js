'use strict';

const axios = require('axios');
const moment = require('moment');
const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient();

exports.accountingHandler = async (event, context, callback) => {
    var today = moment();
    var yesterday = moment().subtract(1, 'days');

    try {
        const response = await axios({
            url: 'https://api.football-data.org/v2/matches?fromDate=' + yesterday.format('YYYY-MM-DD') + '&toDate=' + today.format('YYYY-MM-DD'),
            method: 'GET',
            headers: {
                'X-Auth-Token': 'd7d20ea7ef31413a944837da45a8ef5c'
            }
        });

        console.log(response.data.matches.length, "matches in total")

        var putRequests = [];

        // update yesterday's matches & insert today's matches
        response.data.matches.forEach(function (match) {
            var matchDate = moment(match.utcDate, "YYYY-MM-DDTHH:mm:ssZ");

            if (match.status == 'FINISHED') {
                putRequests.push({
                    PutRequest: {
                        Item: {
                            Id: match.id,
                            HomeTeam: match.homeTeam.name,
                            AwayTeam: match.awayTeam.name,
                            HomeScore: match.score.fullTime.homeTeam,
                            AwayScore: match.score.fullTime.awayTeam,
                            League: match.competition.name,
                            DateTime: matchDate.valueOf(),
                            Status: match.status
                        }
                    }
                });
            } else {
                putRequests.push({
                    PutRequest: {
                        Item: {
                            Id: match.id,
                            HomeTeam: match.homeTeam.name,
                            AwayTeam: match.awayTeam.name,
                            League: match.competition.name,
                            DateTime: matchDate.valueOf(),
                            Status: match.status
                        }
                    }
                });
            }
        });

        var params = {
            RequestItems: {
                "Match": putRequests
            }
        }

        var ddbRes = await ddb.batchWrite(params).promise();
        console.log('ddb response', ddbRes);

        // TODO performing accounting to add points to winners
        // TODO update ranking lists
        callback(null, 'Success!');
    } catch (e) {
        console.log(err, err.stack);
        callback(err.message);
    }
}
