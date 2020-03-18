
var logDetails = '';
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if(request.evtName === 'logToKronos') {
        const workLog = JSON.parse(request.efforts);
        const minutes = getHoursToMinutes(workLog.timeSpent);
        logDetails = {
            "time": [
                {
                    "date": getCurrentDate(),
                    "pid": 1241,
                    "tid": 138,
                    "fid": 230,
                    "minute": minutes,
                    "note": workLog.comment.content[0].content[0].text,
                    "locId": null,
                    "billable": true,
                    "onSite": false,
                    "activityRefNumber": uuidv4()
                }
            ]
        }
        getAuthToken();
    }
});

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
  
function getCurrentDate() {
    var d = new Date();
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
            case "d":
                minutes += parseInt(8 * 60);
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
            console.log(data)
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
                async: false,
                success: function(data, textStatus, jqXHR)
                {
                    if(data.statusCode == 200) {
                        logTimetoKronos(data.responseData);
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