'use strict';

const mysql = require('mysql2/promise');
const config = require('config');

exports.initHandler = async (event, context, callback) => {
    try {
        const connection = await mysql.createConnection({
            host: config.get('db_config.host'),
            port: config.get('db_config.port'),
            user: config.get('db_config.user'),
            password: config.get('db_config.password'),
            database: config.get('db_config.database')
        });

        var result = await connection.query('create table if not exists matches (id bigint unsigned, home_team varchar(64), away_team varchar(64), home_score tinyint unsigned, away_score tinyint unsigned, status varchar(16), date_time bigint unsigned) ENGINE=InnoDB DEFAULT CHARSET=utf8;');

        console.log('create table result', result);

        return "success";
    } catch (e) {
        console.log('create table failed', e);
    }
}
