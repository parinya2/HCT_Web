//Define an angular module for our app
angular.module('hctApp', ['ngRoute','ngSanitize','ngCsv'])
  .controller('HomeController', function($scope, $http) {

    $scope.getExamHistoryHeaderForCsv = function() {
      return ['ลำดับที่','ชื่อ-นามสกุล','เลขประจำตัวประชาชน','หลักสูตรที่เรียน','ผลการสอบ','วันที่สอบ','หมายเลขข้อสอบ','เวลาที่ใช้ (นาที)'];
    }

    $scope.getExamHistoryArrayForCsv = function() {
      var tmpArray = $scope.allData;
      var resultArray = [];
      var passExamCount = 0;
      var failExamCount = 0;
      var notCompleteExamCount = 0;
      for (var i = 0; i < tmpArray.length; i++)
      {
        var obj = tmpArray[i];
        var s = [];
        for (var key in obj)
        {
          var value = obj[key];
          s.push(value);

          if (key == 'ExamResultFlag')
          {
            if (value == 'Y')       passExamCount++;
            else if (value == 'N')  failExamCount++;
            else if (value == 'X')  notCompleteExamCount++;
          }
        }
        var idx = i + 1;
        resultArray.push({p1:idx, p2:s[0], p3:s[1], p4:s[2], p5:s[3], p6:s[4], p7:s[5], p8:s[6]});
      }

      resultArray.push({p1:''});
      resultArray.push({p1:'', p2:'จำนวนคนที่สอบผ่าน', p3:passExamCount});
      resultArray.push({p1:'', p2:'จำนวนคนที่สอบไม่ผ่าน', p3:failExamCount});
      resultArray.push({p1:'', p2:'จำนวนคนที่ทำข้อสอบไม่เสร็จ', p3:notCompleteExamCount});
      return resultArray;
    }

    $scope.chooseExamCourseDropDown = function(text, index) {
      jQuery('#examCourseDropdownText').text(text);
      jQuery('#examCourseDropdownIndex').text(index);
    }

    $scope.loadExamHistoryData = function() {
      var examCourse = jQuery('#examCourseDropdownIndex').text();
      var startDate = jQuery('#homeStartDateText').val();
      var endDate = jQuery('#homeEndDateText').val();

      waitingDialog.show('กรุณารอสักครู่ ...');

      setTimeout(function(){
          $http.get(globalNodeServicesPrefix + "/listExamHistory",
                   {params:{courseType_param:examCourse, startDate_param:startDate, endDate_param:endDate}})
            .success(function(historyResponse) {
              $scope.allData = historyResponse;

              var tmpArray = $scope.allData;
              var passExamCount = 0;
              var failExamCount = 0;
              var notCompleteExamCount = 0;
              for (var i = 0; i < tmpArray.length; i++)
              {
                var obj = tmpArray[i];
                var s = [];
                for (var key in obj)
                {
                  var value = obj[key];

                  if (key == 'ExamResultFlag')
                  {
                    if (value == 'Y')       passExamCount++;
                    else if (value == 'N')  failExamCount++;
                    else if (value == 'X')  notCompleteExamCount++;
                  }
                }
              }
              jQuery('#passExamCountText').text(passExamCount);
              jQuery('#failExamCountText').text(failExamCount);
              jQuery('#notCompleteExamCountText').text(notCompleteExamCount);

              waitingDialog.hide();
            })
      }, 2000);

    }

    selectMenu(0);

    jQuery(function () {
      jQuery('#homeStartDateTimePicker').datetimepicker({
        locale: 'th',
        format: 'DD/MM/YYYY'
      });
      jQuery('#homeEndDateTimePicker').datetimepicker({
        locale: 'th',
        useCurrent: false,
        format: 'DD/MM/YYYY'
      });

      jQuery("#homeStartDateTimePicker").on("dp.change",function (e) {
          jQuery('#homeEndDateTimePicker').data("DateTimePicker").minDate(e.date);
      });
      jQuery("#homeEndDateTimePicker").on("dp.change",function (e) {
          jQuery('#homeStartDateTimePicker').data("DateTimePicker").maxDate(e.date);
      });
    });
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

    selectMenu(99);

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
        locale: 'th'
      });
      jQuery('#historyEndDateTimePicker').datetimepicker({
        locale: 'th',
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
  .controller('ReportController', function($scope) {
    $scope.message = 'This is ReportController';
    selectMenu(1);
  })
  .controller('SettingController', function($scope) {
    $scope.message = 'This is SettingController';
    selectMenu(2);
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
        when('/report', {
          templateUrl: 'templates/report.html',
          controller: 'ReportController'
        }).
        when('/setting', {
          templateUrl: 'templates/setting.html',
          controller: 'SettingController'
        }).
        otherwise({
          redirectTo: '/home'
        });
  }]);
