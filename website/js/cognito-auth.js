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
                        alert('register success');
                        var cognitoUser = result.user;
                        console.log('user name is ' + cognitoUser.getUsername());
                        var confirmation = ('Registration successful. Please check your email inbox or spam folder for your verification code.');
                        if (confirmation) {
                            window.location.href = 'verify.html';
                        }
                    } else {
                        alert('register failed', err);
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
                    alert('Successfully Logged In');
                    // window.location.href = 'ride.html';
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
                    alert("verify email successfully", result);
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

// function signin(email, password, onSuccess, onFailure) {
//     var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
//         Username: email,
//         Password: password
//     });

//     var cognitoUser = createCognitoUser(email);
//     cognitoUser.authenticateUser(authenticationDetails, {
//         onSuccess: onSuccess,
//         onFailure: onFailure
//     });
// }

// function verify(email, code, onSuccess, onFailure) {
//     createCognitoUser(email).confirmRegistration(code, true, function confirmCallback(err, result) {
//         if (!err) {
//             onSuccess(result);
//         } else {
//             onFailure(err);
//         }
//     });
// }

// function createCognitoUser(email) {
//     return new AmazonCognitoIdentity.CognitoUser({
//         Username: email,
//         Pool: userPool
//     });
// }

// /*
//  *  Event Handlers
//  */
// function handleSignin(event) {
//     var email = $('#emailInputSignin').val();
//     var password = $('#passwordInputSignin').val();
//     event.preventDefault();
//     signin(email, password,
//         function signinSuccess() {
//             console.log('Successfully Logged In');
//             window.location.href = 'ride.html';
//         },
//         function signinError(err) {
//             alert(err);
//         }
//     );
// }

// function handleVerify(event) {
//     var email = $('#emailInputVerify').val();
//     var code = $('#codeInputVerify').val();
//     event.preventDefault();
//     verify(email, code,
//         function verifySuccess(result) {
//             console.log('call result: ' + result);
//             console.log('Successfully verified');
//             alert('Verification successful. You will now be redirected to the login page.');
//             window.location.href = signinUrl;
//         },
//         function verifyError(err) {
//             alert(err);
//         }
//     );
// }