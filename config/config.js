// client side configuration file used to configure api addresses
// move it to website/js directory
window._config = {
    cognito: {
        userPoolId: 'eu-west-2_FyDGfQbDB',
        userPoolClientId: '638ur8t6lddj3ifp2kv160p7tm',
        region: 'eu-west-2'
    },
    api: {
        getMatchesUrl: 'https://6x1x0ezwh5.execute-api.eu-west-2.amazonaws.com/Stage/matches',
        commentUrl: 'https://6x1x0ezwh5.execute-api.eu-west-2.amazonaws.com/prod/comment',
        matchDetailUrl: 'https://6x1x0ezwh5.execute-api.eu-west-2.amazonaws.com/prod/match',
        likeUrl: 'https://6x1x0ezwh5.execute-api.eu-west-2.amazonaws.com/Stage/like',
        betUrl: 'https://6x1x0ezwh5.execute-api.eu-west-2.amazonaws.com/prod/bet',
        getBetPointsUrl: 'https://6x1x0ezwh5.execute-api.eu-west-2.amazonaws.com/Stage/getbetpoints',
        getRankingsUrl: 'https://6x1x0ezwh5.execute-api.eu-west-2.amazonaws.com/Stage/rankings'
    }
};