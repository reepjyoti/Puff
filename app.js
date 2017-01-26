'use strict';
// Declare app level module which depends on views, and components
angular.module("myApp", [
  'ngRoute',
  'firebase',
  'ngGeolocation',
  'myApp.login',
  'myApp.firebase',
  'myApp.firebase.home',
  'myApp.firebase.search'

])
    .config(['$routeProvider', function ($routeProvider) {
      $routeProvider.otherwise({redirectTo: '/home'});
    }])



    .factory("Auth", ["$firebaseAuth",
      function($firebaseAuth) {
        return $firebaseAuth();
      }
    ])

    .factory("RemoveUserFromPuffCompanion", ["$firebaseObject",
        function($firebaseObject,$Ff) {
            return $firebaseAuth();
        }
    ])





    .run([function() {
        var config = {
            apiKey: "AIzaSyCqIsSye0wkC4iPdfOjsddDZwhtiq8KLaI",
            authDomain: "puff-a82ae.firebaseapp.com",
            databaseURL: 'https://puff-a82ae.firebaseio.com/',
            storageBucket: "puff-a82ae.appspot.com",
            messagingSenderId: "1042877505731"
        };
        firebase.initializeApp(config);
    }])

    .controller("NavCtrl",['$scope','$location','$rootScope','Auth','Data','$firebaseObject',function($scope,$location,$rootScope,Auth,Data,$firebaseObject){
      $scope.home_path = "/home";
      $scope.map_path = "/search";
      $scope.login_path = "/login";
        $scope.auth = Auth;
        $scope.showWindow = false;
      $scope.activateWindow = function(){
          $scope.showWindow = !$scope.showWindow;
      }
      $scope.IsActive = function(str){
        if ($location.path()==str) return true;
        else return false;
      }
      $scope.logout = function(str){
          $scope.activateWindow();
          var user = firebase.auth().currentUser;
          if (user) {
              var uid = user.uid;
              var obj = $firebaseObject(Data.getUserData(uid));

              obj.$loaded().then(function(){
                  obj.online = false;
                  obj.$save().then(function(ref) {
                  }, function(error) {
                      console.log("Error:", error);
                  });
              });
              $scope.auth.$signOut().then(function() {
                  $scope.showNavbar = false;
              }, function(error) {
                  // An error happened.
              });
          }
      }



      $rootScope.$on('$locationChangeSuccess', function(event){
          firebase.auth().onAuthStateChanged(function(user) {
              if (user) {
                  if ($location.path()==$scope.login_path) {
                      $scope.showNavbar = false;
                  }
                  else {
                      $scope.showNavbar=true;
                  }
              }
              else {
                  //location.reload();
                  $location.path($scope.login_path);
              }

          });


      })





    }]);