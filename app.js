//Define an angular module for our app
var globalNodeServicesPrefix = 'http://128.199.95.79:8081';

angular.module('hctApp', ['ngRoute','ngSanitize','ngCsv'])
  .controller('HomeController', function($scope, $http) {

    $scope.getExamResultPDF = function(recordId) {
      waitingDialog.show('กรุณารอสักครู่ ...');
      setTimeout(function(){
          $http.get(globalNodeServicesPrefix + "/getExamResultPdf",
                   {params:{record_id:recordId}})
            .success(function(examResultPdfResponse) {
              window.open('data:application/pdf;base64,' + examResultPdfResponse);
              waitingDialog.hide();
            })
      }, 2000);
    };

    $scope.downloadExamHistoryPDF = function() {

      var reportDict = getExamHistoryReportDict();
      var resultArray = reportDict['resultArray'];
      var startDateText = reportDict['startDateText'];
      var endDateText = reportDict['endDateText'];
      var passExamCount = reportDict['passExamCount'];
      var failExamCount = reportDict['failExamCount'];
      var notCompleteExamCount = reportDict['notCompleteExamCount'];

      var reportTable = {
          table: {
              headerRows: 1,
              body: resultArray
          }
      };

      pdfMake.fonts = {
        myFont: {
          normal:'Code2000.ttf',
          bold:'Code2000.ttf',
          italics:'Code2000.ttf',
          bolditalics:'Code2000.ttf'
        }
      };

      var dd = {
          defaultStyle: {font:'myFont'},
          pageOrientation: 'landscape',
          content: [
              { text: ' ', style: 'header' },
              { text: 'รายงานผลการสอบ ตั้งแต่วันที่ ' + startDateText + ' ถึงวันที่ ' + endDateText, style: 'header' },
              { text: 'สอบผ่าน จำนวน ' + passExamCount + ' คน', style: 'header' },
              { text: 'สอบไม่ผ่าน จำนวน ' + failExamCount + ' คน', style: 'header' },
              { text: 'ทำข้อสอบไม่เสร็จ จำนวน ' + notCompleteExamCount + ' คน', style: 'header' },
              { text: ' ', style: 'header' },
              reportTable
          ]
      }
      pdfMake.createPdf(dd).download('รายงานผลสอบ.pdf');
    }

    function getExamHistoryReportHeader() {
      return ['ลำดับที่','ชื่อ-นามสกุล','เลขประจำตัวประชาชน','หลักสูตรที่เรียน','ผลการสอบ','วันที่สอบ','หมายเลขข้อสอบ','เวลาที่ใช้ (นาที)'];
    }

    function getExamHistoryReportDict() {
      var resultDict = {};
      var tmpArray = $scope.allData;

      var resultArray = [];
      resultArray.push(getExamHistoryReportHeader());

      var passExamCount = 0;
      var failExamCount = 0;
      var notCompleteExamCount = 0;

      if (tmpArray != null)
      {
        for (var i = 0; i < tmpArray.length; i++)
        {
          var obj = tmpArray[i];
          var idx = i + 1;
          var s = [];
          s.push(idx + '');
          var keyCount = 0;
          for (var key in obj)
          {
            var value = obj[key];
            if (keyCount < 7) {
              s.push(value);
            }
            keyCount++;

            if (key == 'ExamResultFlag')
            {
              if (value == 'Y')       passExamCount++;
              else if (value == 'N')  failExamCount++;
              else if (value == 'X')  notCompleteExamCount++;
            }
          }
          resultArray.push(s);
        }
      }

      var startDateText = jQuery('#searchStartDateText').text();
      var endDateText = jQuery('#searchEndDateText').text();

      resultDict['resultArray'] = resultArray;
      resultDict['notCompleteExamCount'] = notCompleteExamCount;
      resultDict['failExamCount'] = failExamCount;
      resultDict['passExamCount'] = passExamCount;
      resultDict['startDateText'] = startDateText;
      resultDict['endDateText'] = endDateText;

      return resultDict;
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

              startDate = startDate.length > 0 ? startDate : '-';
              endDate = endDate.length > 0 ? endDate : '-';
              jQuery('#searchStartDateText').text(startDate);
              jQuery('#searchEndDateText').text(endDate);

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
