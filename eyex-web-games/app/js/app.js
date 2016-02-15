'use strict';

// Declare app level module which depends on views, and components
var eyexGamesApp = angular.module('myApp', [
	'ngRoute',
	
	'eyexGamesControllers'
]);
//				config(['$routeProvider', function($routeProvider) {
//		$routeProvider.
//						when('/home', {
//			templateUrl: 'partials/project-list.html',
//			controller: 'ProjectListCtrl'
//		}).
//						when('/projects', {
//			templateUrl: 'partials/project-list.html',
//			controller: 'ProjectListCtrl'
//		}).
//						when('/project/:projectId', {
//			templateUrl: 'partials/project-detail.html',
//			controller: 'ProjectDetailCtrl'
//		}).
//						otherwise({redirectTo: '/home'});
//	}]).


