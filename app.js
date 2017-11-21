//Define an angular module for our app
var globalNodeServicesPrefix = 'https://main.clickeexam.in:8443';

function getSchoolDetail(schoolAbbr) {
  jQuery.post(globalNodeServicesPrefix + "/getSchoolDetail" ,
              {schoolAbbr: schoolAbbr},
              function(data, status) {
                  var tmpArray = JSON.parse(data);
                  if (tmpArray.length > 0) {
                    var obj = tmpArray[0];
                    var schoolFullName = obj['SchoolFullName'];
                    var schoolFullNameThai = obj['SchoolFullNameThai'];
                    var schoolCertNo = obj['SchoolCertNo'];
                    jQuery("#schoolNameText").text(schoolFullName);
                    sessionStorage.setItem('targetSchoolCertNo', schoolCertNo);
                    sessionStorage.setItem('schoolFullNameThai', schoolFullNameThai);
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
              var objbuilder = '';
              objbuilder += ('<object width="100%" height="100%"      data="data:application/pdf;base64,');
              objbuilder += (examResultPdfResponse);
              objbuilder += ('" type="application/pdf" class="internal">');
              objbuilder += ('<embed src="data:application/pdf;base64,');
              objbuilder += (examResultPdfResponse);
              objbuilder += ('" type="application/pdf" />');
              objbuilder += ('</object>');

              var win = window.open("","_blank","titlebar=yes");
              win.document.title = “Exam Result“;
              win.document.write('<html><body>');
              win.document.write(objbuilder);
              win.document.write('</body></html>');
              layer = jQuery(win.document);

              waitingDialog.hide();
            })
      }, 2000);
    };

    $scope.downloadExamHistoryExcel = function() {
      var excelData = '';

      var reportDict = getExamHistoryReportDict();
      var resultArray = reportDict['resultArray'];
      var startDateText = reportDict['startDateText'];
      var endDateText = reportDict['endDateText'];
      var passExamCount = reportDict['passExamCount'];
      var failExamCount = reportDict['failExamCount'];
      var notCompleteExamCount = reportDict['notCompleteExamCount'];
      var schoolFullName = jQuery("#schoolNameText").text();
      var schoolFullNameThai = sessionStorage.getItem('schoolFullNameThai');

      var examReportStr = '';

      startDateText = getDateStringThaiFormat(startDateText);
      endDateText = getDateStringThaiFormat(endDateText);

      if (startDateText != '-' && endDateText != '-' &&
          startDateText == endDateText)
      {
   	     examReportStr = 'รายงานผลการสอบ ประจำวันที่ ' + startDateText;
      }
      else
      {
	       examReportStr = 'รายงานผลการสอบ ตั้งแต่วันที่ ' + startDateText + ' ถึงวันที่ ' + endDateText;
      }

	var passExamCountLabel = 'สอบผ่าน';
	var failExamCountLabel = 'สอบไม่ผ่าน';
	var notCompleteExamCountLabel = 'ทำข้อสอบไม่เสร็จ';
	var personLabel = 'คน';
	var examStaffLabel = 'เจ้าหน้าที่คุมสอบ';

	var newLine = '\n';
	var sp = ',';
	excelData += sp + sp + sp + schoolFullNameThai + newLine;
	excelData += sp + sp + sp + schoolFullName + newLine;
	excelData += newLine;
	excelData += sp + sp + sp + examReportStr + newLine;
	excelData += newLine;
	for (var i = 0; i < resultArray.length; i++)
	{
	  var obj = resultArray[i];
	  excelData += '"' + obj[0] + '"' + sp;
	  excelData += '"' + obj[1] + '"' + sp;
	  excelData += '"' + obj[2] + '"' + sp;
	  excelData += '"' + obj[3] + '"' + sp;
	  excelData += '"' + obj[4] + '"' + sp;
	  excelData += '"' + obj[5] + '"' + sp;
	  excelData += '"' + obj[6] + '"' + sp;
	  excelData += '"' + obj[7] + '"' + newLine;
	}
	excelData += newLine;

	excelData += sp + 'สรุปผลการสอบ' + newLine;
	excelData += sp + sp + passExamCountLabel + sp + passExamCount + sp + personLabel + newLine;
	excelData += sp + sp + failExamCountLabel + sp + failExamCount + sp + personLabel + newLine;
	excelData += sp + sp + notCompleteExamCountLabel + sp + notCompleteExamCount + sp + personLabel + newLine;
	excelData += newLine;
	excelData += newLine;
	excelData += sp + sp + sp + sp + sp + '_____________________' + newLine;
	excelData += sp + sp + sp + sp + sp + '(____________________)' + newLine;
	excelData += sp + sp + sp + sp + sp + examStaffLabel + newLine;

window.open('data:text/csv;charset=utf-8;base64,' + window.btoa(unescape(encodeURIComponent(excelData))));
//    window.open('data:application/vnd.ms-excel,' + excelData);
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
      var schoolFullNameThai = sessionStorage.getItem('schoolFullNameThai');

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

      var extraTabStr1 = ' \t\t\t\t\t\t\t';
      var extraTabStr2 = ' \t\t\t\t\t\t\t';
      var extraTabStr3 = '  \t\t\t\t';
      var extraTabStr4 = ' \t\t\t\t\t';
      var extraTabStr5 = '          \t\t\t\t\t\t\t';

      var examReportStr = '';

      startDateText = getDateStringThaiFormat(startDateText);
      endDateText = getDateStringThaiFormat(endDateText);

      if (startDateText != '-' && endDateText != '-' &&
          startDateText == endDateText)
      {
   	     examReportStr = 'รายงานผลการสอบ ประจำวันที่ ' + startDateText;
      }
      else
      {
	       examReportStr = 'รายงานผลการสอบ ตั้งแต่วันที่ ' + startDateText + ' ถึงวันที่ ' + endDateText;
      }

      var dd = {
          defaultStyle: {font:'myFont'},
          pageOrientation: 'landscape',
          content: [
              { text: ' ', style: 'header' },
              { text: schoolFullNameThai, fontSize: 30, alignment: 'center' },
              { text: schoolFullName, fontSize: 25, alignment: 'center' },
              { text: ' ', style: 'header' },
              { text: examReportStr, fontSize: 25, alignment: 'center' },
              { text: ' ', style: 'header' },
              reportTable,
              { text: ' ', style: 'header' },
              { text: '\t\t สรุปผลการสอบ', fontSize: 22, bold: true },
              { text: '\t\t\t สอบผ่าน' + extraTabStr1 + passExamCount + ' คน', fontSize: 20 },
              { text: '\t\t\t สอบไม่ผ่าน' + extraTabStr2 + failExamCount + ' คน', fontSize: 20 },
              { text: '\t\t\t ทำข้อสอบไม่เสร็จ' + extraTabStr3 + notCompleteExamCount + ' คน', fontSize: 20 },
              { text: ' ', style: 'header' },
              { text: ' ', style: 'header' },
              { text: ' ', style: 'header' },
              { text: '______________________' + extraTabStr4, fontSize: 22, alignment: 'right' },
              { text: ' ', style: 'header' },
              { text: '(____________________)' + extraTabStr4, fontSize: 22, alignment: 'right' },
              { text: 'เจ้าหน้าที่คุมสอบ' + extraTabStr5, fontSize: 22,alignment: 'right' }
          ]
      }
      pdfMake.createPdf(dd).download('รายงานผลสอบ.pdf');
    }

    function getExamHistoryReportHeader() {
      return ['ลำดับที่','ชื่อ-นามสกุล','เลขประจำตัว\nประชาชน','หลักสูตรที่เรียน','ผลการสอบ\nเต็ม 50 คะแนน','วันที่สอบ','หมายเลข\nข้อสอบ','เวลาที่ใช้ (นาที)'];
    }

    function getDateStringThaiFormat(dateStr)
    {
      if (dateStr.length < 3)
	return dateStr;

      var tmpArr = dateStr.split('/');
      if (tmpArr.length != 3)
	return dateStr;

      var day = tmpArr[0];
      var month = parseInt(tmpArr[1]);
      var year = parseInt(tmpArr[2]);

      var newMonth = '';
      switch(month)
      {
      	case 1: newMonth = 'มกราคม'; break;
      	case 2: newMonth = 'กุมภาพันธ์'; break;
      	case 3: newMonth = 'มีนาคม'; break;
      	case 4: newMonth = 'เมษายน'; break;
      	case 5: newMonth = 'พฤษภาคม'; break;
      	case 6: newMonth = 'มิถุนายน'; break;
      	case 7: newMonth = 'กรกฏาคม'; break;
      	case 8: newMonth = 'สิงหาคม'; break;
      	case 9: newMonth = 'กันยายน'; break;
      	case 10: newMonth = 'ตุลาคม'; break;
      	case 11: newMonth = 'พฤศจิกายน'; break;
      	case 12: newMonth = 'ธันวาคม'; break;
      }

      var newYear = year < 2500 ? year + 543 : year;

      return day + " " + newMonth + " " + newYear;
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
              if (key == 'ExamDatetime')
	             {
		               var tmpDatetimeArr = value.split(' ');
		               if (tmpDatetimeArr.length > 1)
		               {
            		     var tmpDateArr = tmpDatetimeArr[0].split('/');
            		     var year = parseInt(tmpDateArr[2]);
            		     var thaiYear = year < 2500 ? year + 543 : year;
            		     var newDateStr = tmpDateArr[0] + '/' + tmpDateArr[1] + '/' + thaiYear + '      ';
            		     for (var k = 1; k < tmpDatetimeArr.length; k++)
		               {
			             newDateStr += tmpDatetimeArr[k];
 		          }
		          value = newDateStr;
		      }
	      }
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
  .controller('ReportController', function($scope, $http) {
    $scope.chooseStudentEnrolCourseDropdown = function(text, index) {
      jQuery('#studentEnrolCourseDropdownText').text(text);
      jQuery('#studentEnrolCourseDropdownIndex').text(index);
    }

    $scope.chooseExamCountDropdown = function(rowIndex, examCount) {
      jQuery('#studentExamCountDropdownText'+rowIndex).text(examCount);
    }

    $scope.incrementExamCount = function() {
      var allCitizenIds = '';
      var allCourseTypes = '';

      var tmpArray = $scope.studentEnrolData;
      if (tmpArray == null || tmpArray.length == 0)
	return;

       for (var i = 0; i < tmpArray.length; i++)
      {
	var obj = tmpArray[i];
	for (var key in obj)
        {
          var value = obj[key];
	  if (key == 'CitizenID')
	  {
	      allCitizenIds += value;
	  }
	  if (key == 'CourseType')
	  {
	      allCourseTypes += value;
	  }
	}

	var delimiter = ',';
	if (i != tmpArray.length - 1)
	{
	  allCitizenIds += delimiter;
	  allCourseTypes += delimiter;
	}
      }

      waitingDialog.show('กรุณารอสักครู่...');
      setTimeout(function(){
	$http.post(globalNodeServicesPrefix + "/incrementExamCount", {allCitizenIds: allCitizenIds, allCourseTypes: allCourseTypes})
	  .success(function(studentEnrolResponse) {
		var backUpArray = [];
		for (var i = 0; i < $scope.studentEnrolData.length; i++)
		{
			var newObj = {};
			var oldObj = $scope.studentEnrolData[i];
			newObj["Fullname"] = oldObj["Fullname"];
			newObj["CitizenID"] = oldObj["CitizenID"];
			newObj["CourseType"] = oldObj["CourseType"];
			newObj["CourseName"] = oldObj["CourseName"];
			newObj["EnrolDate"] = oldObj["EnrolDate"];
			newObj["ExamCount"] = parseInt(oldObj["ExamCount"]) + 1;
			backUpArray.push(newObj);
		}

		for (var i = 0 ; i < backUpArray.length; i++)
		{
			$scope.studentEnrolData[i] = backUpArray[i];;
		}
 	    waitingDialog.hide();
	    alert("บันทึกข้อมูลสำเร็จแล้ว");
	  })
      }, 2000);
    }

    $scope.updateStudentEnrol = function(citizenId, courseType, rowIndex) {
      var examCount = jQuery('#studentExamCountDropdownText'+rowIndex).text();
      waitingDialog.show('กรุณารอสักครู่...');
      setTimeout(function(){
	$http.post(globalNodeServicesPrefix + "/updateStudentEnrol", {citizenId:citizenId, courseType:courseType, examCount:examCount})
	  .success(function(studentEnrolResponse) {
	    var oldObj = $scope.studentEnrolData[rowIndex];
	    var newObj = {};
            newObj["Fullname"] = oldObj["Fullname"];
            newObj["CitizenID"] = oldObj["CitizenID"];
            newObj["CourseType"] = oldObj["CourseType"];
            newObj["CourseName"] = oldObj["CourseName"];
            newObj["EnrolDate"] = oldObj["EnrolDate"];
            newObj["ExamCount"] = examCount;
	    $scope.studentEnrolData[rowIndex] = newObj;

	    waitingDialog.hide();
	    alert("บันทึกข้อมูลสำเร็จแล้ว");
	  })
      }, 2000);
    }

    $scope.deleteStudentEnrol = function(citizenId, courseType, rowIndex) {
      var r = confirm("คุณต้องการลบข้อมูลนี้ ใช่หรือไม่ ?");
      if (r == false) {
        return;
      }

      waitingDialog.show('กรุณารอสักครู่...');
      setTimeout(function(){
	$http.post(globalNodeServicesPrefix + "/deleteStudentEnrol", {citizenId:citizenId, courseType:courseType})
	  .success(function(studentEnrolResponse) {
	    $scope.studentEnrolData.splice(rowIndex, 1);
        if ($scope.studentEnrolData.length > 0)
        {
          document.getElementById('incrementExamCountButton').style.visibility = "visible";
        }
        else
        {
          document.getElementById('incrementExamCountButton').style.visibility = "hidden";
        }
         waitingDialog.hide();
        })
      }, 2000);
    }

    $scope.searchStudentEnrol = function(mode) {
      var citizenId = '';
      var enrolDateFrom = '';
      var enrolDateTo = '';

      if (mode == 1)
      {
        citizenId = jQuery('#searchCitizenIdText').val().trim();
        if (citizenId.length == 0) {
	        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
	        return;
        }
      }

      if (mode == 2)
      {
        enrolDateFrom = jQuery('#studentEnrolDateText2').val();
        enrolDateTo = jQuery('#studentEnrolDateText3').val();
      }

      waitingDialog.show('กรุณารอสักครู่...');
      setTimeout(function(){
    	$http.post(globalNodeServicesPrefix + "/searchStudentEnrol", {citizenId:citizenId, enrolDateFrom:enrolDateFrom, enrolDateTo:enrolDateTo})
    	  .success(function(studentEnrolResponse) {
    	    $scope.studentEnrolData = studentEnrolResponse;
	    if (studentEnrolResponse.length > 0)
	    {
	      document.getElementById('incrementExamCountButton').style.visibility = "visible";
	    }
	    else
	    {
	      document.getElementById('incrementExamCountButton').style.visibility = "hidden";
	    }
    	    waitingDialog.hide();
    	  })
      }, 2000);
    }

    $scope.saveStudentEnrol = function() {
      var citizenId = jQuery('#citizenIdText').val().trim();
      var fullname = jQuery('#fullnameText').val();
      var courseType = jQuery('#studentEnrolCourseDropdownIndex').text();
      var enrolDate = jQuery('#studentEnrolDateText').val();

      if (citizenId.length == 0 || fullname.length == 0 || enrolDate.length == 0) {
	      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
	      return;
      }

      waitingDialog.show('กรุณารอสักครู่...');

      setTimeout(function(){
	$http.post(globalNodeServicesPrefix + "/addStudentEnrol", {fullname:fullname, citizenId:citizenId, courseType:courseType, enrolDate:enrolDate})
	  .success(function(data, status, headers, config) {
	    waitingDialog.hide();
	    if (data == "SUCCESS") {
	      alert("บันทึกข้อมูลสำเร็จแล้ว");
	    } else if (data == "DUPLICATE") {
	      alert("ไม่สามารถบันทึกข้อมูลได้ เนื่องจากมีข้อมูลนี้อยู่แล้ว");
	    } else if (data == "ERROR") {
	      alert("เกิดข้อผิดพลาดบางอย่าง กรุณาติดต่อผู้ดูแลระบบ");
	    }
            jQuery('#citizenIdText').val('');
            jQuery('#fullnameText').val('');
	  })
	  .error(function (data, status, headers, config) {
	  });
      }, 2000);
    }

    jQuery(function () {
      jQuery('#studentEnrolDateTimePicker').datetimepicker({
      	locale: 'th',
      	format: 'DD/MM/YYYY',
      	defaultDate: new Date()
      });
      jQuery('#studentEnrolDateTimePicker2').datetimepicker({
      	locale: 'th',
      	format: 'DD/MM/YYYY',
      	defaultDate: new Date()
      });
      jQuery('#studentEnrolDateTimePicker3').datetimepicker({
        locale: 'th',
        format: 'DD/MM/YYYY',
        defaultDate: new Date()
      });

      jQuery("#studentEnrolDateTimePicker2").on("dp.change",function (e) {
          jQuery('#studentEnrolDateTimePicker3').data("DateTimePicker").minDate(e.date);
      });
      jQuery("#studentEnrolDateTimePicker3").on("dp.change",function (e) {
          jQuery('#studentEnrolDateTimePicker2').data("DateTimePicker").maxDate(e.date);
      });
    });
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
