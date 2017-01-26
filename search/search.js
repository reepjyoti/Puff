'use strict';

angular.module('myApp.firebase.search', ['ngRoute','myApp.firebase'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/search', {
            templateUrl: 'search/search.html',
            controller: 'searchCtrl'
        });
    }])

    .controller('searchCtrl', ['$scope','Data','$firebaseObject','$firebaseArray','$geolocation',
        function($scope,Data,$firebaseObject,$firebaseArray,$geolocation) {
            var old_users_positions = new Array();
            var markers = new Array();
            var users_to_change = [];
            var map;
            var uid;
            $scope.oldCompanion = "";

            $scope.noSharedPos = true;
            firebase.auth().onAuthStateChanged(function(currentUser) {
                if (currentUser) {
                    uid = currentUser.uid;
                    var user_data = $firebaseObject(Data.getUserData(uid));
                    user_data.$bindTo($scope,"user").then(function(){

                        $scope.users = $firebaseArray(Data.getUsers());

                        $geolocation.getCurrentPosition({
                            timeout: 60000
                        }).then(function(position) {
                            $scope.noSharedPos = false;
                            $scope.user.position = position.coords.latitude + ","+position.coords.longitude;
                            map = new google.maps.Map(document.getElementById('map'), {
                                zoom: 15,
                                scrollwheel: false,
                                center: new google.maps.LatLng(position.coords.latitude,position.coords.longitude),
                                mapTypeId: google.maps.MapTypeId.ROADMAP
                            });
                            $scope.$watch('user.position', function() {
                                var latLng = new google.maps.LatLng($scope.user.position.split(",")[0],$scope.user.position.split(",")[1]); //Makes a latlng
                                map.panTo(latLng); //Make map global
                            });
                            loadMarkers();
                            setTimeout(function(){updateUserPosition();},10000);

                        });
                        $scope.oldCompanion = $scope.user.puffing_companion;
                        $scope.$watch('user.puffing_companion', function() {
                            if ($scope.user.online){
                                if (print_message) $scope.createMessage();
                                else print_message = true;
                            }
                        });
                    });

                } else {
                    return null;
                }
            });

            function updateUserPosition(){
                $geolocation.getCurrentPosition({
                    timeout: 60000
                }).then(function(position) {
                    $scope.user.position = position.coords.latitude + ","+position.coords.longitude;
                    setTimeout(function(){updateUserPosition();},10000)
                });
            }

            $scope.distanceSort = function(us) {
                return computeDistance(us.position.split(",")[0],us.position.split(",")[1],$scope.user.position.split(",")[0],$scope.user.position.split(",")[1]);
            };

            function computeDistance(lat1, lon1, lat2, lon2){
                var p = 0.017453292519943295;    // Math.PI / 180
                var c = Math.cos;
                var a = 0.5 - c((lat2 - lat1) * p)/2 +
                    c(lat1 * p) * c(lat2 * p) *
                    (1 - c((lon2 - lon1) * p))/2;

                return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
            }

            function loadMarkers(){
                var users_data = $scope.users;
                users_data.$loaded().then(function(){
                    for (var i = 0; i < users_data.length; i++) {
                        var key = users_data.$keyAt(i);

                        var u = users_data.$getRecord(key);
                        if ((key != uid)&&(u.online)){
                            var obj= {
                                lat : u.position.split(",")[0],
                                long : u.position.split(",")[1],
                                sex : u.sex,
                                message : u.message,
                                comp_count : u.puffing_companion.split(",").length - 1,
                                nick : u.nick,
                                avatar : u.avatar
                            }
                            old_users_positions[key]=obj;

                            var marker = new google.maps.Marker({
                                position: new google.maps.LatLng(u.position.split(",")[0],u.position.split(",")[1]),
                                map: map,
                                id: key
                            });

                            if (u.sex == "male")marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
                            else marker.setIcon('http://maps.google.com/mapfiles/ms/icons/pink-dot.png');

                            markers[key] = marker;
                            google.maps.event.addListener(markers[key], 'click', function(e) {
                                var markerId = e.latLng;
                                for (var k in old_users_positions){
                                    var old_user_position=new google.maps.LatLng(old_users_positions[k].lat,old_users_positions[k].long);

                                    if (old_user_position.toString()==markerId.toString()){
                                        $scope.show_hide_info(old_users_positions[k].nick,old_users_positions[k].avatar,old_users_positions[k].sex,old_users_positions[k].message);
                                    }
                                }
                            });
                        }
                    }
                   setTimeout(function(){isUpdateRequired();},3000);
                });
            }

            function isUpdateRequired(){
                var users_data = $scope.users;
                users_data.$loaded().then(function(){
                    for (var i = 0; i < users_data.length; i++) {
                        var key = users_data.$keyAt(i);
                        var u = users_data.$getRecord(key);
                        var new_users_positions = [];
                        if ((key != uid)&&(u.online)){

                            var obj_new= {
                                lat : u.position.split(",")[0],
                                long : u.position.split(",")[1]
                            }
                            new_users_positions[key]=obj_new;
                            if (key in old_users_positions){
                                if ((Math.abs(parseFloat(new_users_positions[key].lat)-parseFloat(old_users_positions[key].lat))>0.000)||parseFloat((Math.abs(new_users_positions[key].long)-parseFloat(old_users_positions[key].long))>0.001)){
                                    old_users_positions[key].lat = new_users_positions[key].lat;
                                    old_users_positions[key].long = new_users_positions[key].long;

                                    markers[key].setPosition(new google.maps.LatLng(u.position.split(",")[0],u.position.split(",")[1]));


                                }
                            }
                            else {
                                var obj= {
                                    lat : u.position.split(",")[0],
                                    long : u.position.split(",")[1],
                                    sex : u.sex,
                                    message : u.message,
                                    comp_count : u.puffing_companion.split(",").length - 1,
                                    nick : u.nick,
                                    avatar: u.avatar
                                }
                                old_users_positions[key]=obj;
                                var marker = new google.maps.Marker({
                                    position: new google.maps.LatLng(u.position.split(",")[0],u.position.split(",")[1]),
                                    map: map,
                                    id: key
                                });

                                if (u.sex == "male")marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
                                else marker.setIcon('http://maps.google.com/mapfiles/ms/icons/pink-dot.png');

                                markers[key] = marker;
                                google.maps.event.addListener(markers[key], 'click', function(e) {
                                    var markerId = e.latLng;
                                    for (var k in old_users_positions){
                                        var old_user_position=new google.maps.LatLng(old_users_positions[k].lat,old_users_positions[k].long);
                                        if (old_user_position.toString()==markerId.toString()){
                                            $scope.show_hide_info(old_users_positions[k].nick,old_users_positions[k].avatar,old_users_positions[k].sex,old_users_positions[k].message);
                                        }
                                    }
                                });
                            }
                        }
                        else if ((!u.online)&&(key in old_users_positions)){
                            var m = markers[key];
                            m.setMap(null);
                            m=null;
                            delete markers[key];
                            delete old_users_positions[key];

                        }
                    }
                });
                setTimeout(function(){isUpdateRequired();},3000);
            }

            var print_message = true;


            $scope.addUserToPuffingCompanion = function(us_id,us_puff_comp,us_puff_comp_id,us_nick){
                $scope.user.puffing_start_time =  new Date().getTime();
                var old_puff_comp=$scope.user.puffing_companion;
                var old_puff_comp_id=$scope.user.puffing_companion_id;
                print_message = false;
                $scope.user.puffing_companion =  us_nick + ","+ us_puff_comp ;
                $scope.user.puffing_companion_id =  us_id + ","+ us_puff_comp_id ;
                $scope.oldCompanion = $scope.user.puffing_companion;
                var users_data = $scope.users;
                users_data.$loaded().then(function(){
                    var user_clicked = $firebaseObject(Data.getUserData(us_id));
                    user_clicked.$loaded().then(function(){
                        var old_puffing_comp = user_clicked.puffing_companion;
                        user_clicked.puffing_companion = user_clicked.puffing_companion +old_puff_comp+ $scope.user.nick+",";
                        user_clicked.puffing_companion_id = user_clicked.puffing_companion_id +old_puff_comp+ uid+",";

                        user_clicked.$save().then(function(rf) {

                        }, function(error) {
                            console.log("Error:", error);
                        })
                        for (var i = 0; i < users_data.length; i++) {
                            var key = users_data.$keyAt(i);
                            var u = users_data.$getRecord(key);
                            if (old_puffing_comp.indexOf(u.nick)!=-1){
                                var user_clicked_friend = $firebaseObject(Data.getUserData(key));
                                user_clicked_friend.$loaded().then(function(){
                                    user_clicked_friend.puffing_companion = user_clicked_friend.puffing_companion +old_puff_comp+  $scope.user.nick+",";
                                    user_clicked_friend.puffing_companion_id = user_clicked_friend.puffing_companion_id +old_puff_comp_id+ uid+",";
                                    user_clicked_friend.$save().then(function(rf) {

                                    }, function(error) {
                                        console.log("Error:", error);
                                    })
                                });
                            }
                        }
                    });
                });
            }

            var evaluated_user;

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
                                if (it.puffing_companion_id == ""){
                                    it.puffing_start_time = "";
                                }
                                it.$save().then(function(rf) {
                                     // true
                                }, function(error) {
                                    console.log("Error:", error);
                                })
                            }
                        });
                    }
                }
                var d = new Date().getTime();
                if (($scope.user.puffing_start_time!="")&&($scope.user.puffing_companion_id != "")){
                    if (d-$scope.user.puffing_start_time>60000) $scope.evaluation_flag = true;
                }
                print_message = false;
                $scope.user.puffing_companion='';
                $scope.user.puffing_companion_id='';
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
            $scope.infowindow = false;
            $scope.evaluation_flag = false;

            $scope.colorSex = function(sex){
                if (sex=="female") {
                    return {'color':'#ee989a'};
                }
                else if (sex=="male"){
                    return {'color':'#297add'};
                }
            }

            $scope.show_hide_info = function(nick,avatar,sex,message) {
                if (!$scope.infowindow){
                    $scope.infonick = nick;
                    $scope.infoavatar = avatar.toString();
                    if (sex == "female"){
                        $scope.infosex = {'background-color':'#ee989a'};
                    }
                    else $scope.infosex = {'background-color':'#297add'};
                    $scope.infomessage = message;
                }
                $scope.infowindow = !$scope.infowindow;
            }




            $scope.setSex = function(sex){
                $scope.user.sex = sex;
            }
            $scope.newcompanion_flag = false;

            $scope.remove_newcompanion_flag = function () {
                $scope.newcompanion_flag = false;
            }
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



        }]);
