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
    $("#loader").show();
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
            $('#totalLoggedTime').html('0H 0M');
            if(items.loggedTaskList !== "") {
                prepareTaskTable(items.loggedTaskList)
            }

        } else {
            $("#loggedMsg").hide();
            $("#login").show();
            $("#editDetails").hide();
        }
    });

    $("#loader").hide();
}

function prepareTaskTable(loggedList) {
    const loggedListJson = JSON.parse(loggedList);
    if(loggedListJson.currentDate === getCurrentDate(new Date())) {
        var trLog = ""
        var totalLoggedTimes = 0;
        loggedListJson.list.forEach(list => {
            trLog += `<tr>`;
            trLog += `<td>${(list.issueId) ? list.issueId : '-'}</td>`;
            trLog += `<td><select id="taskList${list.tid}" class="taskLists" data-loggedTask='${JSON.stringify(list)}'>${getTaskOptions(list.tid)}</select></td>`;
            trLog += `<td>${minutesToHHMM(list.minute)}</td>`;
            trLog += `<td>${list.note}</td>`;
            trLog += `<td><button type="button" data-activityRefno="${list.activityRefNumber}" class="deleteLog">Delete</button></td>`;
            trLog += `</tr>`;
            totalLoggedTimes = parseInt(totalLoggedTimes) + parseInt(list.minute)
        });
        $("#logTbl").find('tbody').html(trLog);
        $('#totalLoggedTime').html(minutesToHHMM(totalLoggedTimes));
        $(".deleteLog").on('click', function() {
            let activityRefno = $(this).attr('data-activityRefno');
            $("#loader").show();
            deleteLogfromKronos(activityRefno);
        })
        
        $(".taskLists").on('change', function() {
            let oldLoggedTask = $(this).attr('data-loggedTask');
            let newTaskid = $(this).val();
            $("#loader").show();
            updateTask(oldLoggedTask, newTaskid);
        })
        
    } else {
        $("#logTbl").find('tbody').html('');
    }
    $("#loader").hide();
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
        resetNewTaskForm();
        chrome.storage.sync.get({
            task: ''
        }, function (items) {
            $("#newTasks").html(getTaskOptions(items.task));
            var hoursOptions = `<option value=''>Select hours</option>`;
            for (let i = 1; i <= 12; i++) {
                hoursOptions += `<option value='${i}h'>${i}</option>`;
            }
            $("#nTHours").html(hoursOptions);
            var minutesOptions = `<option value=''>Select minutes</option>`;
            for (let i = 0; i < 60; i++) {
                minutesOptions += `<option value='${i}m'>${i}</option>`;
            }
            $("#nTMinutes").html(minutesOptions);
        });
    });

    $("#saveNewTask").on('click', function(){
        let task = $("#newTasks").val();
        let hours = $("#nTHours").val();
        let minutes = $("#nTMinutes").val();
        let details = $("#details").val();
        if(task !== "" && hours !== "" && minutes !== "" && details !== "") {
            $("#loader").show();
            chrome.storage.sync.get({
                project: '',
            }, function (items) {
                logDetails = {
                    "time": [
                        {
                            "date": getCurrentDate(new Date()),
                            "pid": items.project !== '' ? items.project : 1241,
                            "tid": task,
                            "fid": 230,
                            "minute": getHoursToMinutes(`${hours} ${minutes}`),
                            "note": details,
                            "locId": null,
                            "billable": true,
                            "onSite": false,
                            "activityRefNumber": uuidv4()
                        }
                    ]
                }
                isManuallyAdded = true;
                getAuthToken();
            });
        } else {
            alert("Please fill all the require fields");
        }
    })

    $("#cancelFrmBtn").on('click', function(){
        $("#loggedMsg").show();
        $("#addTaskSec").hide();
    })

})

function resetNewTaskForm() {
    $("#newTasks").val('');
    $("#nTHours").val('');
    $("#nTMinutes").val('');
    $("#details").val('');
    $("#loader").hide();
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('editDetails').addEventListener('click', toogleBlock);