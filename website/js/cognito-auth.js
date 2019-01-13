new Vue({
    el: '#registrationForm',
    data: {
        user: {
            email: '',
            password: '',
            confirmPassword: '',
        }
    },
    methods: {
        submit: function () {
            var dataEmail = {
                Name: 'email',
                Value: this.user.email,
            };

            var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);

            userPool.signUp(this.user.email, this.user.password, [attributeEmail], null,
                function signUpCallback(err, result) {
                    if (!err) {
                        alert('Registration success.');
                        var cognitoUser = result.user;
                        console.log('user name is ' + cognitoUser.getUsername());
                        var confirmation = ('Registration successful. Please check your email inbox or spam folder for your verification code. Go back later to ./verify.html in case you do not want to verify your email address right now.');
                        if (confirmation) {
                            window.location.href = 'verify.html';
                        }
                    } else {
                        alert('Regsitration failed:' + err.message);
                    }
                }
            );
        }
    }
})

new Vue({
    el: '#signinForm',
    data: {
        user: {
            email: '',
            password: '',
        }
    },
    methods: {
        submit: function () {
            console.log(this.user.email, this.user.password);
            var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
                Username: this.user.email,
                Password: this.user.password
            });

            var cognitoUser = new AmazonCognitoIdentity.CognitoUser({
                Username: this.user.email,
                Pool: userPool
            });

            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: function (result) {
                    alert('Successfully Logged In.');
                    window.location.href = 'index.html';
                },
                onFailure: function (err) {
                    alert(err);
                }
            });
        }
    }
})

new Vue({
    el: '#verifyForm',
    data: {
        email: '',
        code: ''
    },
    methods: {
        submit: function () {
            console.log('verify', this.email, this.code);

            var cognitoUser = new AmazonCognitoIdentity.CognitoUser({
                Username: this.email,
                Pool: userPool
            });

            cognitoUser.confirmRegistration(this.code, true, function confirmCallback(err, result) {
                if (!err) {
                    alert("Verification of the email successfull.", result);
                    window.location.href = "signin.html";
                } else {
                    alert("failed to verify email", err);
                }
            });
        }
    }
})

var poolData = {
    UserPoolId: _config.cognito.userPoolId,
    ClientId: _config.cognito.userPoolClientId
};

var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
