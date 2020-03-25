var taskList;
function saveOptions() {
    var email = $("#email").val();
    var password = $("#password").val();
    
    if(email == '') {
        return setValidationMsg('email','Email address is required');
    } else if(IsEmail(email) == false){
        return setValidationMsg('email','Please enter a valid email address');
    } else if(password == '') {
        return setValidationMsg('password','Password is required');
    }
    const userDetails = {
        "username": email,
        "password": password
    }
    $.ajax({
        url : "https://kronos.idc.tarento.com/api/v1/user/login",
        type: "POST",
        contentType: 'application/json; charset=utf-8',
        data : JSON.stringify(userDetails),
        dataType: 'json',
        success: function(data, textStatus, jqXHR)
        {
            if(data.statusCode == 200) {
                userDetails.authToken = data.responseData.sessionId
                saveCredentials(userDetails);
            } else if(data.statusCode == 400) {
                $("#loggedErr").show();
                setTimeout(function () {
                    $("#loggedErr").hide();
                }, 1000);
                return false;
            }
        }
    });
}

async function saveCredentials(data) {
    chrome.storage.sync.set({
        email: data.username,
        password: data.password,
        authToken: data.authToken
    }, function () {
        var status = document.getElementById('status');
        status.textContent = 'Email address and password saved.';
        setTimeout(function () {
            status.textContent = '';
            window.close();
            chrome.tabs.create({ url: "options.html" });
        }, 750);
    });
}

async function setValidationMsg(selector,errMsg) {
    $(".form-group").removeClass("has-error").find(".error").html("");
    $('#'+selector).parent(".form-group").addClass("has-error").find(".error").html(errMsg);
    return false;
}

async function IsEmail(email) {
    var regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if(!regex.test(email)) {
      return false;
    }else{
      return true;
    }
}

function restoreOptions() {
    chrome.storage.sync.get({
        email: '',
        password: '',
        taskList: '',
        loggedTaskList: ''
    }, function (items) {
        document.getElementById('email').value = items.email ? items.email : '';
        document.getElementById('password').value = items.password ? items.password : '';
        if(items.email != '' && items.password != '') {
            $("#loggedMsg").show();
            $("#login").hide();
            $("#editDetails").show();
            if(items.taskList !== "") {
                const tList = JSON.parse(items.taskList);
                taskList = tList;
            }
            if(items.loggedTaskList !== "") {
                prepareTaskTable(items.loggedTaskList)
            }
        } else {
            $("#loggedMsg").hide();
            $("#login").show();
            $("#editDetails").hide();
        }
    });
}

function prepareTaskTable(loggedList) {
    const loggedListJson = JSON.parse(loggedList);
    if(loggedListJson.currentDate === getCurrentDate(new Date())) {
        var trLog = ""
        var totalLoggedTimes = 0;
        loggedListJson.list.forEach(list => {
            trLog += `<tr>`;
            trLog += `<td>${(list.issueId) ? list.issueId : '-'}</td>`;
            trLog += `<td><select id="taskList${list.tid}" class="taskLists" data-logRef="${list.activityRefNumber}">${getTaskOptions(list.tid)}</select></td>`;
            trLog += `<td>${minutesToHHMM(list.minute)}</td>`;
            trLog += `<td>${list.note}</td>`;
            trLog += `</tr>`;
            totalLoggedTimes = parseInt(totalLoggedTimes) + parseInt(list.minute)
        });
        $("#logTbl").find('tbody').html(trLog);
        $('#totalLoggedTime').html(minutesToHHMM(totalLoggedTimes));
    } else {
        $("#logTbl").find('tbody').html('');
        $('#totalLoggedTime').html('0H 0M');
    }
}

function getTaskOptions(selectedTask) {
    console.log(selectedTask)
    var taskOptions = "<option value=''>Select Task</option>";
    taskList.forEach(task => {
        taskOptions += `<option value="${task.id}" ${task.id == selectedTask ? 'selected' : ''}>${task.name}</option>`;
    });
    return taskOptions;
}

function minutesToHHMM(minutes) {
    let hours = Math.floor(minutes / 60);  
    let min = minutes % 60;
    return `${hours}H ${min}M`;
}

function toogleBlock() {
    $("#loggedMsg,#login").toggle();
}

$(document).ready(function(){
    $("#addNewTaskBtn").on('click', function(){
        $("#loggedMsg").hide();
        $("#addTaskSec").show();
        chrome.storage.sync.get({
            task: ''
        }, function (items) {
            $("#newTasks").html(getTaskOptions(items.task));
            var hoursOptions = `<option value=''>Select hours</option>`;
            for (let i = 1; i <= 12; i++) {;
                hoursOptions += `<option value='${i}h'>${i}</option>`;
            }
            $("#nTHours").html(hoursOptions);
            var minutesOptions = `<option value=''>Select minutes</option>`;
            for (let i = 1; i <= 60; i++) {;
                minutesOptions += `<option value='${i}m'>${i}</option>`;
            }
            $("#nTMinutes").html(minutesOptions);
        });
    });

    $("#cancelFrmBtn").on('click', function(){
        $("#loggedMsg").show();
        $("#addTaskSec").hide();
    })
})

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('editDetails').addEventListener('click', toogleBlock);