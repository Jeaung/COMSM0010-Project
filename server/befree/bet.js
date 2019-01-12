'use strict';

const mysql = require('mysql2/promise');
const config = require('config');

exports.initBettingHandler = async (event, context, callback) => {
    try {
        const connection = await mysql.createConnection({
            host: config.get('db_config.host'),
            port: config.get('db_config.port'),
            user: config.get('db_config.user'),
            password: config.get('db_config.password'),
            database: config.get('db_config.database')
        });

        var result = await connection.query('create table if not exists bets (id_bet bigint unsigned auto_increment not null, username varchar(255), match_id bigint unsigned, bet_value bigint unsigned, score_predicted char(1), date_time bigint unsigned, PRIMARY KEY (id_bet)) ENGINE=InnoDB DEFAULT CHARSET=utf8;');

        console.log('create table result', result);

        return "success";
    } catch (e) {
        console.log('create table failed', e);
    }
}

exports.initRankingsHandler = async (event, context, callback) => {
    try {
        const connection = await mysql.createConnection({
            host: config.get('db_config.host'),
            port: config.get('db_config.port'),
            user: config.get('db_config.user'),
            password: config.get('db_config.password'),
            database: config.get('db_config.database')
        });

        var result = await connection.query('create table if not exists rankings (id_rankings bigint unsigned auto_increment not null, username varchar(255), bet_points bigint unsigned, PRIMARY KEY (id_rankings)) ENGINE=InnoDB DEFAULT CHARSET=utf8;');

        console.log('create table result', result);

        return "success";
    } catch (e) {
        console.log('create table failed', e);
    }
}