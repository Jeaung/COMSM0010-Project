new Vue({
    el: '#matchTable',
    data: function () {
        return {
            matches: []
        }
    },
    created: function () {
        axios.get(_config.api.getMatchesUrl)
            .then(response => {
                this.matches = response.data;
                console.log(response.data);
                var currentMatch;
                for (var k = 0; k<this.matches.length; k++){
                    currentMatch = this.matches[k]
                    console.log(currentMatch.date_time);
                    currentMatch.date_time = timeConverter(currentMatch.date_time);
                }
            })
            .catch(e => {
                console.log(e);
            })
    },
    methods: {
        matchDetail: function (matchId) {
            console.log('click', matchId);
            // this.$router.push({path:'/match.html'});
            window.location.href = 'match.html?id=' + matchId;
        }
    }
});

new Vue({
    el: '#signout',
    methods: {
        signout: function () {
            console.log('signout');
            cognitoUser.signOut();
            alert('signed out');
        }
    }
});

function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours().toString();;
    if (hour.length == 1){
        hour = "0" + hour
    }
    var min = a.getMinutes().toString();;
    if (min.length == 1){
        min = "0" + min
    }
    var sec = a.getSeconds().toString();
    if (sec.length === 1){
        sec = "0" + sec;
    }    
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
}

var poolData = {
    UserPoolId: _config.cognito.userPoolId,
    ClientId: _config.cognito.userPoolClientId
};

var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
var cognitoUser = userPool.getCurrentUser();
console.log('user', cognitoUser);
var authToken;

if (cognitoUser) {
    cognitoUser.getSession(function sessionCallback(err, session) {
        if (err) {
            console.log(err);
        } else if (!session.isValid()) {
            console.log('session invalid');
        } else {
            authToken = session.getIdToken().getJwtToken();
            console.log('auth token', authToken);
        }
    });
}
