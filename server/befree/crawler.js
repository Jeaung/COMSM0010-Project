'use strict';

const axios = require('axios');
const moment = require('moment');
const mysql = require('mysql2/promise');
const config = require('config');

exports.accountingHandler = async (event, context, callback) => {
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

        console.log(response.data.matches.length, "matches in total")

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

        // TODO performing accounting to add points to winners
        // TODO update ranking lists

        return "success";
    } catch (e) {
        console.log(e, e.stack);
        return "error";
    }
}
