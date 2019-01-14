
function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours().toString();;
    if (hour.length == 1) {
        hour = "0" + hour
    }
    var min = a.getMinutes().toString();;
    if (min.length == 1) {
        min = "0" + min
    }
    var sec = a.getSeconds().toString();
    if (sec.length === 1) {
        sec = "0" + sec;
    }
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
}

function isInt(value) {
    return !isNaN(value) &&
        parseInt(Number(value)) == value &&
        !isNaN(parseInt(value, 10));
}

var poolData = {
    UserPoolId: _config.cognito.userPoolId,
    ClientId: _config.cognito.userPoolClientId
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
var cognitoUser = userPool.getCurrentUser();
console.log('user', cognitoUser);
var authToken;

if (cognitoUser){
    console.log('user', cognitoUser);
    document.getElementById('signinbutton').innerHTML = '<h4><span class="badge badge-secondary" style="margin-right:10px; margin-top:10px;">'+cognitoUser.username+'</span></h4>';
}

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

var currentMatchId;
new Vue({
    el: "#app",
    data: function () {
        return {
            comments: [],
            match: null,
            content: "",
            betPossible: false,
            betPoints: 0
        }
    },
    created: function () {
        var urlParams = new URLSearchParams(window.location.search);
        console.log(urlParams.get('id'));
        axios.get(_config.api.matchDetailUrl + '?id=' + urlParams.get('id'))
            .then(response => {
                this.comments = response.data.comments;
                for (var k = 0; k < this.comments.length; k++) {
                    this.comments[k].Created = timeConverter(this.comments[k].Created);
                }
                this.match = response.data.match;
                if (this.match.date_time < Math.floor(Date.now() / 1000)){
                    this.betPossible = false;
                } else {
                    this.betPossible = true;
                }
                this.match.date_time = timeConverter(this.match.date_time);
                currentMatchId = this.match.id;
            })
            .catch(e => {
                console.log(e);
            });
        if (cognitoUser){    
            axios.get(_config.api.getBetPointsUrl + '?username=' + cognitoUser.username)
                .then(response => {
                    this.betPoints = response.data.betPoints;
                    console.log(response.data.betPoints)
                })
                .catch(e => {
                    console.log(e);
                });
            document.getElementById('betDivUser').style.display = 'block';
            document.getElementById('betDivNotUser').style.display = 'none';
            document.getElementById('commentUser').style.display = 'block';
            document.getElementById('commentNotUser').style.display = 'none';                 
        } else {
            document.getElementById('betDivNotUser').style.display = 'block';
            document.getElementById('betDivUser').style.display = 'none';
            document.getElementById('commentNotUser').style.display = 'block';
            document.getElementById('commentUser').style.display = 'none';
        }
    },
    methods: {
        postBet: function (matchId, scorePred) {
            console.log('bet', matchId, scorePred, document.getElementById('bettingNumber').value);
            if (isInt(document.getElementById('bettingNumber').value)) {
                axios({
                    url: _config.api.betUrl,
                    data: {
                        matchId: matchId,
                        betPoints: document.getElementById('bettingNumber').value,
                        scorePredicted: scorePred
                    },
                    headers: {
                        'Authorization': authToken
                    },
                    method: 'post'
                }).then(response => {
                    console.log(response.data);
                    if (!alert(response.data.return_value)) { window.location.reload(); }
                }).catch(e => {
                    console.log(e);
                });
            } else {
                alert("You must enter an integer.");
            }
        },
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
        goToLink: function(str){
            var replaced = str.split(' ').join('+');
            window.open("https://google.com/search?q="+str, '_blank');
        },
        postComment: function (matchId, content) {
            console.log(content);
            axios({
                url: _config.api.commentUrl,
                data: {
                    matchId: matchId,
                    content: content,
                },
                headers: {
                    'Authorization': authToken
                },
                method: 'post'
            }).then(response => {
                console.log(response.data);
                this.content = "";
                this.comments.unshift({
                    "MatchId": matchId,
                    'User': cognitoUser.username,
                    "Content": content,
                    'Likes': 0,
                    'Created': timeConverter(Math.floor(response.data.timestamp))
                });
            }).catch(e => {
                alert(e.response.data.err);
                console.log(e);
            });
        }
    },
});
