'use strict';


angular.module('myApp.firebase.service', [])

    .factory('Data', ['$firebaseArray','$firebaseObject',function(Ref,$firebaseArray, $firebaseObject) {

        return {
            getUserData: function(uid){
                var ref_user = firebase.database().ref("users/"+uid);
                //alert(ref_user);
                //var a=$firebaseArray(rootRef);
                //alert(a);
                return ref_user;
            },
            getUsers: function(){
                var ref_user = firebase.database().ref("users");
                //alert(ref_user);
                //var a=$firebaseArray(rootRef);
                //alert(a);
                return ref_user;
            }
        }
    }]);



