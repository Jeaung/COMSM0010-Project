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
            })
            .catch(e => {
                console.log(e);
            })
    }
})

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
} else {
    console.log('not signed in');
    window.location.href = 'signin.html';
}
