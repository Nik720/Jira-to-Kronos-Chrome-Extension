
var logDetails = '';
var currentIssueId = '';
var isManuallyAdded = false;
console.log("content script")
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if(request.evtName === 'logToKronos') {
        const workLog = JSON.parse(request.efforts);
        const minutes = getHoursToMinutes(workLog.timeSpent);
        currentIssueId = request.url.split('issue/')[1].split('/worklog')[0];
        chrome.storage.sync.get({
            project: '',
            task: '',
        }, function (items) {
            const notes = (workLog.comment.content[0].content.length > 0) ? `Issue ${currentIssueId} - ${workLog.comment.content[0].content[0].text}` : `Issue ${currentIssueId} ` ; 
            logDetails = {
                "time": [
                    {
                        "date": getCurrentDate(workLog.started),
                        "pid": items.project !== '' ? items.project : 1241,
                        "tid": items.task !== '' ? items.task : 138,
                        "fid": 230,
                        "minute": minutes,
                        "note": notes,
                        "locId": null,
                        "billable": true,
                        "onSite": false,
                        "activityRefNumber": uuidv4()
                    }
                ]
            }
            getAuthToken();
        });
    }
});

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
  
function getCurrentDate(date) {
    var d = new Date(date);
    var month = d.getMonth()+1;
    var day = d.getDate();
    var output = d.getFullYear() + '-' +
        ((''+month).length<2 ? '0' : '') + month + '-' +
        ((''+day).length<2 ? '0' : '') + day;
    return output;
}

function getHoursToMinutes (time) {
    const timeArr = time.split(" ");    
    var minutes = 0;
    timeArr.forEach(elm => {
        const caseIndex = elm.charAt(elm.length-1);
        switch (caseIndex) {
            case "w":
                let week = elm.substring(0, elm.length-1);
                minutes += (parseInt(week) * 5 * 8) * 60;
                break;
            case "d":
                let day = elm.substring(0, elm.length-1);
                minutes += (parseInt(day) * 8) * 60;
                break;
            case "h":
                let hr = elm.substring(0, elm.length-1);
                minutes += (parseInt(hr) * 60)
                break;
            case "m":
                let mnt = elm.substring(0, elm.length-1);
                minutes += parseInt(mnt);
                break;    
            default:
                break;
        }
    });
    return minutes;
}
 
function logTimetoKronos (userData) {
    let authToken = userData.sessionId
    logDetails.time[0].activityRefNumber = `${userData.email}#${uuidv4()}`;
    $.ajax({
        // tarento URL: https://kronos.idc.tarento.com/api/v1/user/saveTaskTimeForProject
        // ekstep URL: https://kronos.idc.tarento.com/api/v1/user/saveTaskTimeForProjectFeature

        url : "https://kronos.idc.tarento.com/api/v1/user/saveTaskTimeForProjectFeature",
        type: "POST",
        contentType: 'application/json; charset=utf-8',
        data : JSON.stringify(logDetails),
        dataType: 'json',
        headers: {
            "Authorization": authToken
        },
        success: function(data)
        {
            if(data.statusCode === 320) {
                alert(`This particular date ${logDetails.time[0].date}  is locked in kronos. Please add time log manually in kronos.`)
                return false;
            } else if(data.statusCode === 200) {
                chrome.storage.sync.get({
                    loggedTaskList: ''
                }, function (items) {
                    var parsedTime = {
                        currentDate: getCurrentDate(new Date()),
                        list: []
                    };
                    if(items.loggedTaskList !== "") {
                        const loggedTask = JSON.parse(items.loggedTaskList)
                        parsedTime = (loggedTask.currentDate === getCurrentDate(new Date())) ? loggedTask : parsedTime
                    }
                    logDetails.time[0].issueId = currentIssueId
                    parsedTime.list.push(logDetails.time[0]);
                    chrome.storage.sync.set({
                        loggedTaskList: JSON.stringify(parsedTime)
                    }, function(){
                        if(isManuallyAdded) {
                            $("#cancelFrmBtn").click();
                            restoreOptions();
                            isManuallyAdded = false;
                        }
                    });
                });
            }
        },
        error: function (jqXHR)
        {
            console("error while adding logs to kronos. ",jqXHR);
        }
    });
}

function getAuthToken( ) {
    const userDetails = {
        "username": "",
        "password": ""
    }
    chrome.storage.sync.get({
        email: '',
        password: '',
    }, function (items) {
        userDetails.username = items.email ? items.email : '';
        userDetails.password = items.password ? items.password : '';
        if(userDetails.username !== "" && userDetails.password !== "") {
            $.ajax({
                url : "https://kronos.idc.tarento.com/api/v1/user/login",
                type: "POST",
                contentType: 'application/json; charset=utf-8',
                data : JSON.stringify(userDetails),
                dataType: 'json',
                success: function(data, textStatus, jqXHR)
                {
                    if(data.statusCode == 200) {
                        chrome.storage.sync.set({
                            authToken: data.responseData.sessionId
                        }, function(){
                            logTimetoKronos(data.responseData);
                        });
                    } else if(data.statusCode == 400) {
                        alert("Invalid Kronos credentials. Please try again.");
                        return false;
                    }
                },
                error: function (jqXHR, textStatus, errorThrown)
                {
                    console(jqXHR);
                }
            });
        } else {
            alert("Please sign to kronos using plugin.")
            return false;
        }
    });
    
}

function updateTask(tdetails, newTaskid) {
    chrome.storage.sync.get({
        authToken: '',
    }, function (items) {
        let authToken = items.authToken
        let oldTask = JSON.parse(tdetails);
        oldTask.tid = newTaskid;
        delete oldTask.issueId;
        $.ajax({
            url : "https://kronos.idc.tarento.com/api/v1/user/updateTaskTimeForProjectFeature",
            type: "POST",
            contentType: 'application/json; charset=utf-8',
            data : JSON.stringify({'time': [oldTask]}),
            dataType: 'json',
            headers: {
                "Authorization": authToken
            },
            success: function(data)
            {
                if(data.statusCode === 200) {
                    chrome.storage.sync.get({
                        loggedTaskList: ''
                    }, function (items) {
                        if(items.loggedTaskList !== "") {
                            const loggedTask = JSON.parse(items.loggedTaskList)
                            const newLoggedTaskList = []
                            loggedTask.list.map((task) => {
                                if(task.activityRefNumber === oldTask.activityRefNumber) {
                                    task.tid = newTaskid;
                                }
                                newLoggedTaskList.push(task);
                            }); 
                            loggedTask.list = newLoggedTaskList;
                            chrome.storage.sync.set({
                                loggedTaskList: JSON.stringify(loggedTask)
                            }, function(){
                                $("#sucessMsg").html("Task updated in kronos.").show();
                                setTimeout(() => {
                                    $("#sucessMsg").html("").hide();
                                }, 3000);
                                restoreOptions();
                            });
                        }
                    });
                } else {
                    alert(data.statusMessage);
                    $("#commonErrMsg").html(data.statusMessage).show();
                    setTimeout(() => {
                        $("#commonErrMsg").html("").hide();
                    }, 3000);
                    restoreOptions();
                }
            },
            error: function (jqXHR)
            {
                console("error while adding logs to kronos. ",jqXHR);
            }
        });
    });
    
}