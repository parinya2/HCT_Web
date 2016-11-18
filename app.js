//Define an angular module for our app
var globalNodeServicesPrefix = 'http://128.199.95.79:8081';

function getSchoolDetail(schoolAbbr) {
  jQuery.post(globalNodeServicesPrefix + "/getSchoolDetail" ,
              {schoolAbbr: schoolAbbr},
              function(data, status) {
                  var tmpArray = JSON.parse(data);
                  if (tmpArray.length > 0) {
                    var obj = tmpArray[0];
                    var schoolFullName = obj['SchoolFullName'];
                    var schoolCertNo = obj['SchoolCertNo'];
                    jQuery("#schoolNameText").text(schoolFullName);
                    sessionStorage.setItem('targetSchoolCertNo', schoolCertNo);
                }
              });
}

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
      var schoolFullName = jQuery("#schoolNameText").text();

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
              { text: schoolFullName, style: 'header' },
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
      var targetSchoolCertNo = sessionStorage.getItem('targetSchoolCertNo');

      waitingDialog.show('กรุณารอสักครู่ ...');

      setTimeout(function(){
          $http.get(globalNodeServicesPrefix + "/listExamHistory",
                   {params:{courseType_param:examCourse, startDate_param:startDate,
                            endDate_param:endDate, targetSchoolCertNo_param:targetSchoolCertNo}})
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

  })
  .controller('LoginController', function($scope, $http) {
    $scope.login = function(username, password) {
      $http.post(globalNodeServicesPrefix + "/login", {username_param:username, password_param: password})
        .success(function(data, status, headers, config) {
          if (data.indexOf('SUCCESS') != -1) {
            //document.cookie = 'user=' + username +'; expires=Thu, 18 Dec 2019 12:00:00 UTC;';
            var tmpArr = data.split(",");
            if (tmpArr.length == 3) {

              var currentURL = window.location.href;
              var startIdx = currentURL.indexOf('://') + 3;
              var endIdx = currentURL.indexOf('.clickeexam');
              var targetSchoolAbbr = currentURL.substring(startIdx, endIdx);

              sessionStorage.setItem('user', username);
              sessionStorage.setItem('schoolAbbr', tmpArr[1]);
              sessionStorage.setItem('schoolCertNo', tmpArr[2]);
              sessionStorage.setItem('targetSchoolAbbr', targetSchoolAbbr);

              window.location.href = './index.html';
            }
          } else if (data == 'FAIL') {
            alert("ชื่อผู้ใช้หรือรหัสผ่านผิด กรุณาลองอีกครั้ง");
          }
        })
        .error(function (data, status, header, config) {

        });
    };
  })
  .controller('ReportController', function($scope) {
    $scope.message = 'This is ReportController';
  })
  .controller('SettingController', function($scope) {
    $scope.message = 'This is SettingController';
  })
  .controller('NavBarController', function($scope) {
    $scope.logout = function() {
      sessionStorage.clear();
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
