new Vue({
    el: "#app",
    data: function () {
        return {
            comments: [],
            match: null,
            content: ""
        }
    },
    created: function () {
        var urlParams = new URLSearchParams(window.location.search);
        console.log(urlParams.get('id'));

        axios.get(_config.api.matchDetailUrl + '?id=' + urlParams.get('id'))
            .then(response => {
                this.comments = response.data.comments;
                this.match = response.data.match;
            })
            .catch(e => {
                console.log(e);
            });
    },
    methods: {
        likeComment: function (comment) {
            console.log('like', comment.User, comment.MatchId, authToken);

            axios({
                url: _config.api.likeUrl,
                data: {
                    matchId: comment.MatchId,
                    user: comment.User
                },
                headers: {
                    'Authorization': authToken
                },
                method: 'post'
            }).then(response => {
                console.log(response.data);
                comment.Likes += 1;
            }).catch(e => {
                console.log(e);
            });
        },
        postComment: function (matchId, content) {
            console.log(content);
            axios({
                url: _config.api.commentUrl,
                data: {
                    matchId: matchId,
                    content: content
                },
                headers: {
                    'Authorization': authToken
                },
                method: 'post'
            }).then(response => {
                console.log(response.data);
                this.comments.unshift({
                    "MatchId": matchId,
                    'User': cognitoUser.username,
                    "Content": content,
                    'Likes': 0,
                    'Created': Math.floor(Date.now() / 1000)
                });
            }).catch(e => {
                console.log(e);
            });
        }
    },
});

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
