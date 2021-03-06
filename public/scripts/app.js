angular
  .module('AuthSampleApp', [
    'ui.router',
    'satellizer'
    // TODO #2: Add satellizer module
  ])
  .controller('MainController', MainController)
  .controller('HomeController', HomeController)
  .controller('LoginController', LoginController)
  .controller('SignupController', SignupController)
  .controller('LogoutController', LogoutController)
  .controller('ProfileController', ProfileController)
  .service('Account', Account)
  .config(configRoutes)
  ;


////////////
// ROUTES //
////////////

configRoutes.$inject = ["$stateProvider", "$urlRouterProvider", "$locationProvider"]; // minification protection
function configRoutes($stateProvider, $urlRouterProvider, $locationProvider) {

  //this allows us to use routes without hash params!
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });

  // for any unmatched URL redirect to /
  $urlRouterProvider.otherwise("/");

  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'templates/home.html',
      controller: 'HomeController',
      controllerAs: 'home'
    })
    .state('signup', {
      url: '/signup',
      templateUrl: 'templates/signup.html',
      controller: 'SignupController',
      controllerAs: 'sc',
      resolve: {
        skipIfLoggedIn: skipIfLoggedIn
      }
    })
    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginController',
      controllerAs: 'lc',
      resolve: {
        skipIfLoggedIn: skipIfLoggedIn
      }
    })
    .state('logout', {
      url: '/logout',
      template: null,
      controller: 'LogoutController',
      resolve: {
        loginRequired: loginRequired
      }
    })
    .state('profile', {
      url: '/profile',
      templateUrl: 'templates/profile.html',
      controller: 'ProfileController',
      controllerAs: 'profile',
      resolve: {
        loginRequired: loginRequired
      }
    });


    function skipIfLoggedIn($q, $auth) {
      var deferred = $q.defer();
      if ($auth.isAuthenticated()) {
        deferred.reject();
      } else {
        deferred.resolve();
      }
      return deferred.promise;
    }

    function loginRequired($q, $location, $auth) {
      var deferred = $q.defer();
      if ($auth.isAuthenticated()) {
        deferred.resolve();
      } else {
        $location.path('/login');
      }
      return deferred.promise;
    }

}

/////////////////
// CONTROLLERS //
/////////////////

MainController.$inject = ["Account"]; // minification protection
function MainController (Account) {
  var vm = this;

  vm.currentUser = function() {
   return Account.currentUser();
  };

}

HomeController.$inject = ["$http"]; // minification protection
function HomeController ($http) {
  var vm = this;
  vm.posts = [];
  vm.new_post = {}; // form data

  $http.get('/api/posts')
    .then(function (response) {
      vm.posts = response.data;
    });

  vm.createPost = function() {
    $http
      .post('/api/posts', vm.new_post)
      .then(function(response) {
        vm.posts.push(response.data);
      });
    vm.new_post = {};
  };
}

LoginController.$inject = ["Account",  "$location"]; // minification protection
function LoginController (Account, $location) {
  var vm = this;
  vm.new_user = {}; // form data

  vm.login = function() {
         // TODO #4: clear sign up form
         // TODO #5: redirect to '/profile'
    Account
      .login(vm.new_user)
      .then(function(){
        console.log("logged in");
        vm.new_user.password = null;
        vm.new_user.email = null;
        $location.path('/profile');
      });
  };
}

SignupController.$inject = ['Account', '$location']; // minification protection
function SignupController (Account, $location) {
  var vm = this;
  vm.new_user = {}; // form data

  vm.signup = function() {
    Account
      .signup(vm.new_user)
      .then(function () {
          // TODO #9: clear sign up form
          vm.new_user.displayName = null;
          vm.new_user.username = null;
          vm.new_user.email = null;
          vm.new_user.password = null;
          // TODO #10: redirect to '/profile'
          $location.path('/profile');
        }
      );
  };
}

LogoutController.$inject = ["Account", "$location"]; // minification protection
function LogoutController (Account, $location) {
  Account.logout()
  .then(function() {
    $location.path("/login");
  });
  // TODO #7: when the logout succeeds, redirect to the login page

}


ProfileController.$inject = ['Account']; // minification protection
function ProfileController(Account) {
  var vm = this;
  vm.new_profile = {}; // form data

  vm.updateProfile = function() {
    // TODO #14: Submit the form using the relevant `Account` method
    Account
      .updateProfile(vm.new_profile)
      .then(function() {
      // On success, clear the form
      vm.new_profile.displayName = null;
      vm.new_profile.username = null;
      vm.new_profile.email = null;
      });
  };
}

//////////////
// Services //
//////////////

Account.$inject = ["$http", "$q", "$auth"]; // minification protection
function Account($http, $q, $auth) {
  var self = this;
  self.user = null;

  self.signup = signup;
  self.login = login;
  self.logout = logout;
  self.currentUser = currentUser;
  self.getProfile = getProfile;
  self.updateProfile = updateProfile;

  function signup(userData) {
    // TODO #8: signup (https://github.com/sahat/satellizer#authsignupuser-options)
    // returns a promise
      return(
      $auth
        .signup(userData)
        .then(
          function onSuccess(response) {
      // then, set the token (https://github.com/sahat/satellizer#authsettokentoken)
            $auth.setToken(response.data.token);
          },

          function onError(error) {
            console.log('We have an error, gentlemen: ', response);
          }
        )
      );
  }

  function login(userData) {
    return (
      $auth
        .login(userData) // login (https://github.com/sahat/satellizer#authloginuser-options)
        .then(
          function onSuccess(response) {
            //TODO #3: set token (https://github.com/sahat/satellizer#authsettokentoken)
          $auth.setToken(response.data.token);
          },

          function onError(error) {
            console.error(error);
          }
        )
    );
  }

  function logout() {
    // returns a promise!!!
    // TODO #6: logout the user by removing their jwt token (using satellizer)
    // Make sure to also wipe the user's data from the application:
    // self.user = null;
    // returns a promise!!!
    return (
      $auth
        .logout()
        .then(function() {
          self.user = null;
        })
    );
  }

  function currentUser() {
    if ( self.user ) { return self.user; }
    if ( !$auth.isAuthenticated() ) { return null; }

    var deferred = $q.defer();
    getProfile().then(
      function onSuccess(response) {
        self.user = response.data;
        deferred.resolve(self.user);
      },

      function onError() {
        $auth.logout();
        self.user = null;
        deferred.reject();
      }
    );
    self.user = promise = deferred.promise;
    return promise;

  }

  function getProfile() {
    return $http.get('/api/me');
  }

  function updateProfile(profileData) {
    console.log(profileData);
    return (
      $http
        .put('/api/me', profileData)
        .then(
          function (response) {
            self.user = response.data;
          }
        )
    );
  }


}
