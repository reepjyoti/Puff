'use strict';

angular.module('myApp.login', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/login', {
            templateUrl: 'login/login.html',
            controller: 'loginCtrl'
        });
    }])
    //Inline Array Annotation
    //Here we pass an array whose elements consist of a list of strings (the names of the dependencies)
    // followed by the function itself.
    //When using this type of annotation, take care to keep the annotation array
    // in sync with the parameters in the function declaration.
    .controller('loginCtrl', ['$scope', 'Auth', '$location', '$log','Data','$firebaseArray',
        function($scope, Auth, $location, $log,Data,$firebaseArray) {
            $scope.auth = Auth;
            $scope.nicks = "";
            $scope.emails = "";
            var users = $firebaseArray(Data.getUsers());
            users.$loaded().then(function(){
                for (var i = 0; i < users.length; i++) {
                    var key = users.$keyAt(i);
                    var u = users.$getRecord(key);
                    $scope.nicks = $scope.nicks + u.nick+"|_|";
                    $scope.emails = $scope.emails + u.mail+"|_|";
                }
            });
            $scope.success = false;
            $scope.home_path = "/home";
            $scope.already_registered = true;
            $scope.user = {
                email : undefined,
                password : undefined

            };
            $scope.new_user = {
                email : undefined,
                password : undefined,
                confirm_password : undefined,
                nick : undefined
            };
            $scope.error_signup = {
                bool : false,
                value : ""
            }

            $scope.error_fill_login = {
                bool : false,
                value : ""
            }
            // Function: login

            $scope.login = function() {
                $scope.error = null;
                if ($scope.checkIfAllFieldsAreFilledLogin()){
                    if ($scope.error_fill_login.bool){
                        $scope.error_fill_login.bool = false;
                        $scope.error_fill_login.value = "";
                    }
                    // try to login with the given mail and password
                    $scope.auth.$signInWithEmailAndPassword($scope.user.email, $scope.user.password).then(function() {
                        // login successful
                        $location.path($scope.home_path);
                        return true;
                    }).catch(function(error) {
                        // print and log the error
                        $scope.error = error.message;
                        $log.error(error.message);
                        return false;
                    });
                }
            };

            $scope.signUp = function() {
                $scope.error = null;
                if ($scope.checkIfAllFieldsAreFilled()){
                    if ($scope.checkIfEmailAlreadyExists()){
                        if ($scope.checkIfNickAlreadyExists()){
                            if ($scope.checkIfPasswordRepeatedCorrectly()){
                                if ($scope.error_signup.bool){
                                    $scope.error_signup.bool = false;
                                    $scope.error_signup.value = "";
                                }
                                $scope.auth.$createUserWithEmailAndPassword($scope.new_user.email, $scope.new_user.password)
                                    .then(function(firebaseUser) {
                                        var rf = Data.getUsers();

                                        var obj = {
                                            avatar:1,
                                            avatar_knowledge : true,
                                            evaluation : 0,
                                            mail:$scope.new_user.email,
                                            message:"",
                                            nick:$scope.new_user.nick,
                                            online:false,
                                            password:$scope.new_user.password,
                                            position:"",
                                            puffing_companion:"",
                                            puffing_start_time:"",
                                            sex:""
                                        };
                                        rf.child(firebaseUser.uid).set(obj);
                                        $scope.success = true;
                                        $scope.change_already_registered();
                                    }).catch(function(error) {
                                    $scope.error = error.message;
                                    $log.error(error.message);
                                });
                            }
                        }
                    }
                }
            };


            $scope.change_already_registered = function() {
                $scope.already_registered = !$scope.already_registered;
                if ($scope.error_signup.bool){
                    $scope.error_signup.bool = false;
                    $scope.error_signup.value = "";
                }
                if ($scope.error_fill_login.bool){
                    $scope.error_fill_login.bool = false;
                    $scope.error_fill_login.value = "";
                }
            };

            $scope.checkIfAllFieldsAreFilled = function () {
                if (($scope.new_user.password==undefined)||($scope.new_user.confirm_password==undefined)||($scope.new_user.nick==undefined)||($scope.new_user.email==undefined)){
                    $scope.error_signup.value = "Fill all fields";
                    $scope.error_signup.bool = true;
                    return false;
                }
                else return true;
            }

            $scope.checkIfAllFieldsAreFilledLogin = function () {
                if (($scope.user.password==undefined)||($scope.user.email==undefined)){
                    $scope.error_fill_login.value = "Fill all fields";
                    $scope.error_fill_login.bool = true;
                    return false;
                }
                else return true;
            }
            $scope.checkIfPasswordRepeatedCorrectly = function() {
                if($scope.new_user.password == $scope.new_user.confirm_password) return true;
                else {
                    $scope.error_signup.value = "The passwords doesn't match"
                    $scope.error_signup.bool = true;
                    return false;
                }
            };

            $scope.checkIfEmailAlreadyExists = function(){
                if ($scope.emails.indexOf($scope.new_user.email)!=-1) {
                    $scope.error_signup.value = "An user with this email is already present"
                    $scope.error_signup.bool = true;
                    return false;
                }
                else return true;

            }

            $scope.checkIfNickAlreadyExists = function(){
                if ($scope.nicks.indexOf($scope.new_user.nick)!=-1) {
                    $scope.error_signup.value = "The nickname is already present, select another"
                    $scope.error_signup.bool = true;
                    return false;
                }
                else return true;

            }

        }]);

