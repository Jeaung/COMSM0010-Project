'use strict';

const mysql = require('mysql2/promise');
const config = require('config');

exports.initHandler = async (event, context, callback) => {
    try {
        const connection = await mysql.createConnection({
            host: config.get('db_config.host'),
            port: config.get('db_config.port'),
            user: config.get('db_config.user'),
            password: config.get('db_config.password')
        });

        var db = config.get('db_config.database');

        var result = await connection.query('create database if not exists ' + db);
        console.log('create database result', result);

        result = await connection.query('create table if not exists ' + db + '.matches (id bigint unsigned, home_team varchar(64), away_team varchar(64), home_score tinyint unsigned, away_score tinyint unsigned, status varchar(16), date_time bigint unsigned, primary key (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8;');
        console.log('create matches table result', result);

        result = await connection.query('create table if not ´exists ' + db + '.bets (id_bet bigint unsigned auto_increment not null, username varchar(255), match_id bigint unsigned, bet_value bigint unsigned, score_predicted char(1), date_time bigint unsigned, PRIMARY KEY (id_bet)) ENGINE=InnoDB DEFAULT CHARSET=utf8;');
        console.log('create bets table result', result);

        result = await connection.query('create table if not exists ' + db + '.rankings (id_rankings bigint unsigned auto_increment not null, username varchar(255), bet_points bigint unsigned, PRIMARY KEY (id_rankings)) ENGINE=InnoDB DEFAULT CHARSET=utf8;');
        console.log('create rankings table result', result);

        return "success";
    } catch (e) {
        console.log('create table failed', e);
    }
}
