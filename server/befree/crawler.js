'use strict';

const axios = require('axios');
const moment = require('moment');
const mysql = require('mysql2/promise');
const config = require('config');

exports.accountingHandler = async (event, context, callback) => {
    console.log('event source', event);

    var today = moment();
    var yesterday = moment().subtract(1, 'days');

    try {
        const response = await axios({
            url: 'https://api.football-data.org/v2/matches?dateFrom=' + yesterday.format('YYYY-MM-DD') + '&dateTo=' + today.format('YYYY-MM-DD'),
            method: 'GET',
            headers: {
                'X-Auth-Token': 'd7d20ea7ef31413a944837da45a8ef5c'
            }
        });

        console.log(response.data.matches.length, "matches in total");

        var args = [];
        var sqlSb = '';
        response.data.matches.forEach(function (match) {
            if (args.length != 0) {
                sqlSb = sqlSb.concat(',');
            }
            sqlSb = sqlSb.concat('(?,?,?,?,?,?,?)');

            var matchDate = moment(match.utcDate, "YYYY-MM-DDTHH:mm:ssZ");

            if (match.status == 'FINISHED') {
                args.push(match.id, match.homeTeam.name, match.awayTeam.name, match.score.fullTime.homeTeam, match.score.fullTime.awayTeam, matchDate.unix(), match.status);
            } else {
                args.push(match.id, match.homeTeam.name, match.awayTeam.name, 0, 0, matchDate.unix(), match.status);
            }
        });

        const connection = await mysql.createConnection({
            host: config.get('db_config.host'),
            port: config.get('db_config.port'),
            user: config.get('db_config.user'),
            password: config.get('db_config.password'),
            database: config.get('db_config.database')
        });

        var sql = 'replace into matches (id, home_team, away_team, home_score, away_score, date_time, status) values ' + sqlSb;
        console.log('crawler update db sql', sql, 'args', args);

        var result = await connection.execute(sql, args);
        console.log('crawler update db result', result);

        // var previousDay = moment().unix();
        var previousDayStart = moment().utc().subtract(1,'days').startOf('day').unix();
        var previousDayEnd = moment().utc().subtract(1,'days').endOf('day').unix();
        console.log('yesterday started at ', previousDayStart);
        console.log('yesterday ended at ', previousDayEnd);

        var [rows, fields] = await connection.query('SELECT * FROM matches WHERE date_time BETWEEN ? AND ?', [previousDayStart, previousDayEnd]);
        console.log('yesterday matches retrieved from the db', rows);

        var matches = [];
        var tmpScoreResult = "";
        if (rows.length > 0) {
            rows.forEach(element => {
                if (element.home_score > element.away_score){
                    tmpScoreResult = "H";
                } else if (element.home_score < element.away_score){
                    tmpScoreResult = "A";
                } else if (element.home_score === element.away_score){
                    tmpScoreResult = "D";
                } else {
                    console.log("winner was not found")
                }
                matches.push([element.id, tmpScoreResult]);
            });

            console.log(matches);

            var sumBetsMatch;
            var sumBetsWonMatch;
            var rows2;
            var rows3;
            var rows4;
            var rows5;
            var fields2;
            var fields3;
            var fields4;
            var fields5;
            var resultReplace;
            var newBetPoints;
            var userCrtPoints;
            var crtMatchId;
            var temp;
            var temp2;
            var betsregistered;

            for (var k = 0 ; k<matches.length; k++){
                temp = matches[k];
                crtMatchId = temp[0];
                tmpScoreResult = temp[1];
                sumBetsMatch = 0;
                sumBetsWonMatch = 0;
                betsregistered = [];

                [rows2, fields2] = await connection.query('SELECT * FROM bets WHERE match_id = ?', [crtMatchId]);
                console.log('yesterday bets retrieved on the match ', crtMatchId);

                if (rows2.length > 0) {
                    rows2.forEach(element => {
                        betsregistered.push([element.username, element.bet_value, element.score_predicted]);
                    });
                    console.log('bets registered', betsregistered);

                    [rows3, fields3] = await connection.query('SELECT SUM(bet_value) AS totalbets FROM bets WHERE match_id = ?', [crtMatchId]);
                    rows3.forEach(element => {
                        sumBetsMatch = element.totalbets;
                    });
                    console.log('yesterday total bets for the match were ', sumBetsMatch);

                    [rows4, fields4] = await connection.query('SELECT SUM(bet_value) AS totalbets FROM bets WHERE match_id = ? AND score_predicted = ?', [crtMatchId, tmpScoreResult]);
                    rows4.forEach(element => {
                        sumBetsWonMatch = element.totalbets;
                    });
                    console.log('yesterday total bets that won for the match were ', sumBetsWonMatch);

                    for (var l = 0 ; l<betsregistered.length ; l++){
                        temp2 = betsregistered[l];
                        [rows5, fields5] = await connection.query('SELECT * FROM rankings WHERE username = ?', [temp2[0]]);

                        if (rows5.length > 0) {
                            newBetPoints = 0;
                            userCrtPoints = 0;

                            rows5.forEach(element => {
                                userCrtPoints = element.bet_points;
                            });
                            console.log('got the number of points of the user ', userCrtPoints);

                            if (temp2[2] === tmpScoreResult){
                                newBetPoints = Math.abs(sumBetsMatch * (temp2[1] / sumBetsWonMatch)) + userCrtPoints;

                                resultReplace = await connection.query('UPDATE rankings SET bet_points = ? WHERE username = ?', [newBetPoints, temp2[0]]);
                                console.log('updated the bet points of the user', resultReplace);
                            } else {
                                newBetPoints = userCrtPoints
                                if (newBetPoints < 2){
                                    newBetPoints = 2;
                                    resultReplace = await connection.query('UPDATE rankings SET bet_points = ? WHERE username = ?', [newBetPoints, temp2[0]]);
                                    console.log('updated the bet points of the user because he had less than two points', resultReplace);   
                                } else {
                                    console.log('the user lost his points');
                                }
                            }
                        } else {
                            console.log('couldnt find the user number of points');
                        }                        
                    }
                } else {
                    console.log('there was no bets for the match ', crtMatchId);
                }
            }
        } else {
            console.log('there was no matches yesterday');
        }
        return "success";
    } catch (e) {
        console.log(e, e.stack);
        return "error";
    }
}
