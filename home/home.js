'use strict';

angular.module('myApp.firebase.home', ['ngRoute','myApp.firebase'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/home', {
            templateUrl: 'home/home.html',
            controller: 'homeCtrl'
        });
    }])
    //Inline Array Annotation
    //Here we pass an array whose elements consist of a list of strings (the names of the dependencies)
    // followed by the function itself.
    //When using this type of annotation, take care to keep the annotation array
    // in sync with the parameters in the function declaration.
    .controller('homeCtrl', ['$scope','Data','$firebaseObject','$firebaseArray','$geolocation',
        function($scope,Data,$firebaseObject,$firebaseArray,$geolocation) {
            var uid;
            var users_to_change = [];
            var placehold1 = "Add a message...";
            var placehold2 =  "Change your message (this will delete your precedent message)";
            $scope.new_message = ""
            $scope.window_message = "";
            $scope.placeholder = "";
            $scope.oldCompanion = "";
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    uid = user.uid;
                    var user_data = $firebaseObject(Data.getUserData(uid));
                    user_data.$bindTo($scope,"user").then(function(){
                        if ($scope.user.online) updateUserPosition();
                        $scope.checkPlaceHolder();
                        $scope.oldCompanion = $scope.user.puffing_companion;
                        $scope.$watch('user.puffing_companion', function() {
                            if ($scope.user.online) $scope.createMessage();
                        });
                    });
                } else {
                    return null;
                }
            });


            $scope.changeUserState=function(){
                $scope.user.online = !$scope.user.online;
                if ($scope.user.online) {
                    updateUserPosition();
                }
                else {
                    $scope.deleteFromOtherUsers();

                }
                $scope.user.message = "";
                $scope.checkPlaceHolder();
            }

            function updateUserPosition(){
                $geolocation.getCurrentPosition({
                    timeout: 60000
                }).then(function(position) {
                    $scope.user.position = position.coords.latitude + ","+position.coords.longitude;
                    setTimeout(function(){updateUserPosition();},5000)
                });
            }

            $scope.createNewMessage=function(){
                $scope.user.message = $scope.new_message;
                document.getElementById("message").value = "";
                $scope.checkPlaceHolder();
            }
            $scope.updateNewMessage=function(value){
                $scope.new_message = value;
            }

            $scope.checkPlaceHolder = function(){
                if ($scope.user.message == "")  $scope.placeholder = placehold1;
                else $scope.placeholder = placehold2;
            }

            $scope.isOffline = function(state){
                if (state == undefined) return false;
                else if (!state) return true;
                else return false;
            }

            $scope.isOnline = function(state){
                if (state == undefined) return false;
                else if (state) return true;
                else return false;
            }

            $scope.remove_newcompanion_flag = function () {
                $scope.newcompanion_flag = false;
            }

            $scope.newcompanion_flag = false;

            $scope.createMessage = function(){
                var comp;
                if ($scope.oldCompanion.length < $scope.user.puffing_companion.length){
                    $scope.newcompanion_flag = true;
                    if ($scope.oldCompanion == ""){
                        comp = $scope.user.puffing_companion.split(",")[0];
                    }
                    else {
                        var arr1 = $scope.user.puffing_companion.split(",");
                        var arr2 = $scope.oldCompanion.split(",");
                        for (var el in arr1){
                            if (arr2.indexOf(arr1[el])==-1){
                                comp = arr1[el];
                                break;
                            }
                        }
                    }

                    $scope.window_message = comp + " is going to Puff with you !!!";

                }


                else if ($scope.oldCompanion.length > $scope.user.puffing_companion.length){
                    $scope.newcompanion_flag = true;
                    if ($scope.user.puffing_companion == ""){
                        comp = $scope.oldCompanion.split(",")[0];
                        $scope.window_message = comp + " is stopping to Puff !!! No one is puffing with you ";
                    }

                    else {
                        var arr1 = $scope.user.puffing_companion.split(",");
                        var arr2 = $scope.oldCompanion.split(",");
                        for (var el in arr2){
                            if (arr1.indexOf(arr2[el])==-1){
                                comp = arr2[el];
                                break;
                            }
                        }
                        $scope.window_message = comp + " is stopping to Puff !!!";
                    }
                }

                $scope.oldCompanion = $scope.user.puffing_companion;
            }
            var evaluated_user ;
            $scope.deleteFromOtherUsers = function (){
                users_to_change = [];
                var companion = $scope.user.puffing_companion_id.split(",");
                evaluated_user = companion[0];
                for (var i=0;i<companion.length;i++){
                    if (companion[i]!=""){
                        var rf = Data.getUserData(companion[i]);
                        var item = $firebaseObject(rf);
                        users_to_change.push({
                            ref : rf,
                            item : item
                        });
                        item.$loaded().then(function(){
                            for (var i=0; i<users_to_change.length;i++){
                                var it = users_to_change[i].item;
                                it.puffing_companion =it.puffing_companion.replace($scope.user.nick+",","");
                                it.puffing_companion_id = it.puffing_companion_id.replace(uid+",","");
                                it.$save().then(function(rf) {
                                    // true
                                }, function(error) {
                                    console.log("Error:", error);
                                })
                            }
                        });
                    }
                }
                $scope.user.puffing_companion = "";
                var d = new Date().getTime()
                if (($scope.user.puffing_start_time!="")&&($scope.user.puffing_companion_id != "")){
                    if (d-$scope.user.puffing_start_time>60000) $scope.evaluation_flag = true;
                }
                $scope.user.puffing_companion_id = "";
                $scope.puffing_start_time="";
            }

            $scope.evaluate = function(value){
                var rf = Data.getUserData(evaluated_user);
                var item = $firebaseObject(rf);
                item.$loaded().then(function(){
                    var precedent_value = item.evaluation;
                    var precedent_avatar = item.avatar;
                    item.evaluation = precedent_value + value;
                    switch(item.evaluation) {
                        case item.evaluation  == -5:
                            item.avatar = 5;
                            break;
                        case item.evaluation == 0:
                            item.avatar = 1;
                            break;
                        case item.evaluation == 5:
                            item.avatar = 2;
                            break;
                        case item.evaluation == 10:
                            item.avatar = 3;
                            break;
                        case item.evaluation == 15:
                            item.avatar = 4;
                            break;

                    }
                    if (precedent_avatar != item.avatar){
                        item.avatar_knowledge = true;
                    }
                    item.$save().then(function(ref) {
                         // true
                    }, function(error) {
                        console.log("Error:", error);
                    });
                });
                $scope.evaluation_flag = false;
            }

            $scope.evaluation_flag = false;

            $scope.setSex = function(sex){
                $scope.user.sex = sex;
            }



            $scope.home_path = "/home";
            $scope.map_path = "/search";
            $scope.login_path = "/login";
            $scope.showNavbar=true;
        }]);
