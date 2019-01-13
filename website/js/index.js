var poolData = {
    UserPoolId: _config.cognito.userPoolId,
    ClientId: _config.cognito.userPoolClientId
};

var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
var cognitoUser = userPool.getCurrentUser();

if (cognitoUser){
    console.log('user', cognitoUser);
    document.getElementById('signinbutton').innerHTML = '<h4><span class="badge badge-secondary" style="margin-right:10px; margin-top:10px;">'+cognitoUser.username+'</span></h4>';
}

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

var today = new Date();
var dd = today.getDate();

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

function showDiv(str){
    var elementHome = document.getElementById("homeLink");
    var elementRanking = document.getElementById("rankingsLink");
    var elementAbout = document.getElementById("homeLink");
    if (str === "rankings"){
        document.getElementById('rankings').style.display = 'block';
        document.getElementById('home').style.display = 'none'; 
        document.getElementById('about').style.display = 'none';
        elementRanking.classList.add("active");
        elementHome.classList.remove("active");
        elementAbout.classList.remove("active");
    } else if (str === "home"){
        document.getElementById('home').style.display = 'block';
        document.getElementById('rankings').style.display = 'none'; 
        document.getElementById('about').style.display = 'none';
        elementHome.classList.add("active");
        elementRanking.classList.remove("active");
        elementAbout.classList.remove("active");           
    } else if (str === "about"){
        document.getElementById('about').style.display = 'block';
        document.getElementById('rankings').style.display = 'none'; 
        document.getElementById('home').style.display = 'none';
        elementAbout.classList.add("active");
        elementHome.classList.remove("active");
        elementRanking.classList.remove("active");            
    }
}

new Vue({
    el: '#content',
    data: function () {
        return {
            upcoming_matches: [],
            passed_matches: [],
            matches: [],
            rankings: [],
            user_ranking: []
        }
    },
    created: function () {
        axios.get(_config.api.getMatchesUrl)
            .then(response => {
                this.matches = response.data;
                console.log(response.data);
                var currentMatch;
                var currentDateTime = Math.floor(Date.now() / 1000);
                for (var k = 0; k<this.matches.length; k++){
                    currentMatch = this.matches[k]        
                    if (currentMatch.date_time < currentDateTime){
                        currentMatch.date_time = timeConverter(currentMatch.date_time);
                        this.passed_matches.push(currentMatch);
                    } else {
                        currentMatch.date_time = timeConverter(currentMatch.date_time);
                        this.upcoming_matches.push(currentMatch);
                    }
                }
            })
            .catch(e => {
                console.log(e);
            })
        if (cognitoUser){
            axios.get(_config.api.getRankingsUrl + '?username=' + cognitoUser.username)
                .then(response => {
                    this.rankings = response.data.rankings;
                    if (response.data.userRanking.result !== ""){
                        document.getElementById('userRankingDiv').innerHTML = response.data.userRanking.result;
                    } else {
                        this.user_ranking.push(response.data.userRanking);
                    }
                    console.log(response.data);
                    console.log(this.rankings);
                })
                .catch(e => {
                    console.log(e);
                })
                document.getElementById('rankingsConnected').style.display = 'block';
                document.getElementById('rankingsNotConnected').style.display = 'none';                
            } else {
                document.getElementById('rankingsNotConnected').style.display = 'block';
                document.getElementById('rankingsConnected').style.display = 'none';
            }
        document.getElementById('home').style.display = 'block';
        document.getElementById('loader').style.display = 'none';    
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

