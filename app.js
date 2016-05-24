//Define an angular module for our app
angular.module('hctApp', ['ngRoute'])
  .controller('HomeController', function($scope, $http) {

    $scope.chooseExamCourseDropDown = function(index) {
      jQuery('#examCourseDropdownText').text(index);
    }

    $scope.loadExamHistoryData = function(examCourse, startDateTime, endDateTime) {

      waitingDialog.show('กรุณารอสักครู่ ...');
      setTimeout(function(){
          $http.get(globalNodeServicesPrefix + "/listExamHistory")
            .success(function(historyResponse) {
              $scope.allData = historyResponse;
              waitingDialog.hide();
            })
      }, 2000);

    }

    $scope.showVehicleDetail = function(data) {
      var latlng = {lat: parseFloat(data.Lat), lng: parseFloat(data.Lon)};
      globalGeocoder.geocode({'location': latlng}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          if (results[0]) {
            jQuery('#vehicleDetailTitle').text(results[0].formatted_address);
          } else {
            window.alert('No results found');
          }
        } else {
          window.alert('Geocoder failed due to: ' + status);
        }
      });
      jQuery('#vehicleDetailModal').modal('show');
      homeGoogleMap.setZoom(16);
      homeGoogleMap.setCenter(latlng);
    };

    $scope.relocateHomeGoogleMap = function(lat, lon) {
      homeGoogleMap.setZoom(16);
      homeGoogleMap.setCenter(new google.maps.LatLng(parseFloat(lat), parseFloat(lon)));
    };

    function drawMarkerOnHomeGoogleMap(mergedDataList) {
      homeGoogleMap = new google.maps.Map(document.getElementById('homeGoogleMap'));
      for (var i = 0; i < mergedDataList.length; i++) {
        var lat = mergedDataList[i].Lat;
        var lon = mergedDataList[i].Lon;
        var deviceID = mergedDataList[i].DeviceID;
        var center = new google.maps.LatLng(parseFloat(lat), parseFloat(lon));
        homeGoogleMap.setCenter(center)

        var marker = new google.maps.Marker({
          position: center,
          map: homeGoogleMap,
          title: deviceID
        });

        google.maps.event.addListener(marker, 'click', function () {
          var targetData;

          for (var i = 0; i < globalMergedDataList.length; i++) {
            var tmpData = globalMergedDataList[i];
            if (tmpData.DeviceID == this.title) {
              targetData = tmpData;
              break;
            }
          }
          renderMarkerDescription(globalGeocoder, homeGoogleMap, googleMapInfoWindow, this, targetData);
        });
      }

      homeGoogleMap.setZoom(12);
      homeGoogleMap.setMapTypeId(google.maps.MapTypeId.ROADMAP);
    }

    function renderMarkerDescription(geocoder, map, infoWindow, marker, targetData) {
      var latlng = {lat: parseFloat(targetData.Lat), lng: parseFloat(targetData.Lon)};
      geocoder.geocode({'location': latlng}, function(results, status) {
        var markerAddress = ' - ';
        if (status === google.maps.GeocoderStatus.OK) {
          if (results[0]) {
            var markerAddress = results[0].formatted_address
          }
        }
        var markerDesc = '<div style="width: 250px">' +
                         '<table>' +
                         '<tr><td style="width: 80px"> ทะเบียน : </td> <td>' + targetData.LicensePlate + '</td></tr>' +
                         '<tr><td style="width: 80px"> ที่อยู่ : </td> <td>' + markerAddress + '</td></tr>' +
                         '<tr><td style="width: 80px"> คนขับ : </td> <td>' + targetData.Driver + '</td></tr>' +
                         '</table>' +
                         '</div>';
        infoWindow.setContent(markerDesc);
        infoWindow.open(map, marker);
      });
    }

    function mergeJSONByDeviceID(deviceList, gpsList) {
      var result = [];
      var keyDeviceID = 'DeviceID';
      var keySpeed = 'Speed';
      var keyAddress = 'Address';
      var keyStatus = 'Status';
      var keyLat = 'Lat';
      var keyLon = 'Lon';
      var keyLicensePLate = 'LicensePlate';
      var keyDriver = 'Driver';

      for (var i = 0; i < deviceList.length; i++) {
        var deviceObj = deviceList[i];
        var deviceID = deviceObj[keyDeviceID];

        for (var k = 0; k < gpsList.length; k++) {
          var gpsObj = gpsList[k];
          var gpsDeviceID = gpsObj[keyDeviceID];

          if (deviceID == gpsDeviceID) {
            var newObj = {};
            newObj[keyDeviceID] = gpsObj[keyDeviceID];
            newObj[keySpeed] = gpsObj[keySpeed];
            newObj[keyAddress] = gpsObj[keyAddress];
            newObj[keyStatus] = gpsObj[keyStatus];
            newObj[keyLat] = gpsObj[keyLat];
            newObj[keyLon] = gpsObj[keyLon];
            newObj[keyLicensePLate] = deviceObj[keyLicensePLate];
            newObj[keyDriver] = deviceObj[keyDriver];

            result.push(newObj);
            break;
          }
        }
      }

      return result;
    }

    selectMenu(0);

    if (globalDeviceList.length == 0) {
      $http.get(globalURLPrefix + "/data-json/device-list-data.json")
        .success(function(deviceResponse) {
        globalDeviceList = deviceResponse;

        $http.get("http://127.0.0.1:8080/chappters-gps/data-json/gps-data.json")
          .success(function(gpsResponse) {
            var mergedData = mergeJSONByDeviceID(globalDeviceList, gpsResponse);
            globalMergedDataList = mergedData;
        //  $scope.allData = mergedData;
            drawMarkerOnHomeGoogleMap(mergedData);
          })
      })
    } else {
      $http.get(globalURLPrefix + "/data-json/gps-data.json")
        .success(function(gpsResponse) {
          var mergedData = mergeJSONByDeviceID(globalDeviceList, gpsResponse);
          globalMergedDataList = mergedData;
        //  $scope.allData = mergedData;
          drawMarkerOnHomeGoogleMap(mergedData);
        })
    }

  })
  .controller('HistoryController', function($scope, $http) {

    $scope.chooseVehicleDropDown = function(index) {
      jQuery('#historyVehicleDropdownText').text(index);
    }

    $scope.initHistoryGoogleMap = function() {
      historyGoogleMap = new google.maps.Map(document.getElementById('historyGoogleMap'));
      historyGoogleMap.setZoom(16);
      historyGoogleMap.setMapTypeId(google.maps.MapTypeId.ROADMAP);

      var center = new google.maps.LatLng(13.770000, 100.620000);
      historyGoogleMap.setCenter(center)
    }

    $scope.loadHistoryData = function(deviceID, startDateTime, endDateTime) {

      waitingDialog.show('กรุณารอสักครู่ ...');
      setTimeout(function(){
          $http.get(globalURLPrefix + "/data-json/history-data.json")
            .success(function(historyResponse) {
              $scope.allData = historyResponse;
              drawMarkerAndLineOnHistoryGoogleMap(historyResponse);
              drawFuelGraph(true, historyResponse);
              waitingDialog.hide();
            })
      }, 2000);

    }

    $scope.relocateHistoryGoogleMap = function(lat, lon) {
      historyGoogleMap.setZoom(16);
      historyGoogleMap.setCenter(new google.maps.LatLng(parseFloat(lat), parseFloat(lon)));
    };

    function drawMarkerAndLineOnHistoryGoogleMap(historyDataList) {
      var flightPlanCoordinates = [];

      for (var i = 0; i < historyDataList.length; i++) {
        var lat = historyDataList[i].Lat;
        var lon = historyDataList[i].Lon;
        var center = new google.maps.LatLng(parseFloat(lat), parseFloat(lon));
        historyGoogleMap.setCenter(center)

        var marker = new google.maps.Marker({
          position: center,
          map: historyGoogleMap
        });

        flightPlanCoordinates.push({lat: parseFloat(lat), lng: parseFloat(lon)});
      }

      var flightPath = new google.maps.Polyline({
        path: flightPlanCoordinates,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 4
      });

      flightPath.setMap(historyGoogleMap);

      historyGoogleMap.setZoom(14);
      historyGoogleMap.setMapTypeId(google.maps.MapTypeId.ROADMAP);
    }

    function drawFuelGraph(flag, historyDataList) {
      var randomScalingFactor = function(){ return Math.round(Math.random()*100)};
      var fuelArray = [];
      var dateTimeArray = [];
      var strokeColor;

      if (flag) {
        for (var i = 0; i < historyDataList.length; i++) {
          var dateTime = historyDataList[i].DateTime;
          var fuelPercentage = historyDataList[i].FuelPercentage;

          dateTimeArray.push(dateTime);
          fuelArray.push(fuelPercentage);
        }
        strokeColor = "rgba(151,187,205,1)";
      } else {
        dateTimeArray = ["",""];
        fuelArray = [0,100];
        strokeColor = "rgba(255,255,255,1)";
      }

      var lineChartData = {
        labels : dateTimeArray,
        datasets : [
          {
            label: "Fuel Graph dataset",
            fillColor : "rgba(151,187,205,0.2)",
            strokeColor : strokeColor,
            pointColor : "rgba(151,187,205,1)",
            pointStrokeColor : "#fff",
            pointHighlightFill : "#fff",
            pointHighlightStroke : "rgba(151,187,205,1)",
            data : fuelArray
          }
        ]
      }

      var ctx = document.getElementById("historyFuelCanvas").getContext("2d");
      if (globalHistoryFuelChart != undefined) {
        globalHistoryFuelChart.destroy();
      }

      if (flag) {
        globalHistoryFuelChart = new Chart(ctx).Line(lineChartData, {
          responsive: true,
          pointHitDetectionRadius : 5,
          bezierCurve : false
        });
      } else {
        globalHistoryFuelChart = new Chart(ctx).Line(lineChartData, {
          responsive: true,
          pointDot : false,
          datasetFill : false,
          pointHitDetectionRadius : 0
        });
      }

    }

    selectMenu(1);

    if (globalDeviceList.length == 0) {
      $http.get(globalURLPrefix + "/data-json/device-list-data.json")
        .success(function(response) {
          $scope.deviceList = response;
          globalDeviceList = response;
      })
    } else {
      $scope.deviceList = globalDeviceList;
    }

    jQuery(function () {

      jQuery('#historyStartDateTimePicker').datetimepicker({
        //locale: 'th'
      });
      jQuery('#historyEndDateTimePicker').datetimepicker({
        //locale: 'th',
        useCurrent: false
      });

      jQuery("#historyStartDateTimePicker").on("dp.change",function (e) {
          jQuery('#historyEndDateTimePicker').data("DateTimePicker").minDate(e.date);
      });
      jQuery("#historyEndDateTimePicker").on("dp.change",function (e) {
          jQuery('#historyStartDateTimePicker').data("DateTimePicker").maxDate(e.date);
      });

      jQuery('input[name="historyDateRange"]').daterangepicker({
        timePicker: true,
        timePicker24Hour: true,
        timePickerIncrement: 15,
        locale: {
            format: 'DD/MM/YYYY   (hh:mm A)'
        },
        dateLimit: {
          days: 3
        }
    });
    });

    drawFuelGraph(false, []);
    $scope.initHistoryGoogleMap();
  })
  .controller('SpeedController', function($scope) {
    $scope.message = 'This is SpeedController';
    selectMenu(2);
  })
  .controller('BoundaryController', function($scope) {
    $scope.message = 'This is BoundaryController';
    selectMenu(3);
  })
  .controller('SettingController', function($scope) {
    $scope.message = 'This is SettingController';
    selectMenu(4);
  })
  .controller('NavBarController', function($scope) {
    $scope.logout = function() {
      window.location.href = './login.html';
    }
  })
  .config(['$routeProvider',
    function($routeProvider) {
      $routeProvider.
        when('/home', {
          templateUrl: 'templates/home.html',
          controller: 'HomeController'
        }).
        when('/history', {
          templateUrl: 'templates/history.html',
          controller: 'HistoryController'
        }).
        when('/speed', {
          templateUrl: 'templates/speed.html',
          controller: 'SpeedController'
        }).
        when('/boundary', {
          templateUrl: 'templates/boundary.html',
          controller: 'BoundaryController'
        }).
        when('/setting', {
          templateUrl: 'templates/setting.html',
          controller: 'SettingController'
        }).
        otherwise({
          redirectTo: '/home'
        });
  }]);
