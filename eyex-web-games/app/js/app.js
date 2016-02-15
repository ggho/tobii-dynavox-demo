'use strict';

// Declare app level module which depends on views, and components

var eyexGamesApp = angular.module('myApp', [
	'ngRoute',
	
	'myApp.gameCaterpillar'
	])
.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
	when('/', {
		templateUrl: 'game-caterpillar/game-caterpillar.html',
		controller: 'gameCaterpillarCtrl'
	}).
	when('/caterpillar', {
		templateUrl: 'game-caterpillar/game-caterpillar.html',
		controller: 'gameCaterpillarCtrl'
	}).
	otherwise({redirectTo: '/'});
}]);


