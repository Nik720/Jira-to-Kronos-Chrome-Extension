import * as moment from 'moment';
import * as $ from 'jquery';
import Helper from './helper';

var logDetails: { time: any; };
var currentIssueId = '';
var isManuallyAdded = false;
console.log("content script")
$(function() {
    console.log(moment())
    const _helper = new Helper();
    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        if(request.evtName === 'logToKronos') {
            const workLog = JSON.parse(request.efforts);
            const minutes = await _helper.getHoursToMinutes(workLog.timeSpent);
            currentIssueId = request.url.split('issue/')[1].split('/worklog')[0];

            const items: any = await _helper.getChromeStorageData({ 
                project: '', task: '',
            }).then((item) => {
                return item
            });
            if(items) {
                const notes = (workLog.comment.content[0].content.length > 0) ? `Issue ${currentIssueId} - ${workLog.comment.content[0].content[0].text}` : `Issue ${currentIssueId} ` ; 
                logDetails = {
                    "time": [
                        {
                            "date": moment(workLog.started).format('YYYY-MM-DD'),
                            "pid": items.project !== '' ? items.project : 1241,
                            "tid": items.task !== '' ? items.task : 138,
                            "fid": 230,
                            "minute": minutes,
                            "note": notes,
                            "locId": null,
                            "billable": true,
                            "onSite": false,
                            "activityRefNumber": await _helper.uuidv4()
                        }
                    ]
                }
                await processTologData();
            }
        }
    });
    
    
    const processTologData = async() => {
        const userDetails = {
            "username": "",
            "password": ""
        }
        const items: any = await _helper.getChromeStorageData({ 
            email: '', password: '',
        }).then((item) => {
            return item
        });

        if(items) {
            userDetails.username = items.email ? items.email : '';
            userDetails.password = items.password ? items.password : '';
            if(userDetails.username !== "" && userDetails.password !== "") {

                var data:any = await _helper.authenticate(userDetails);
                if(data.statusCode == 200) {
                    const setDataToSotage = _helper.setChromeStorageData({
                        authToken: data.responseData.sessionId
                    }).then((res) => { return res; })
                    if(setDataToSotage) {
                        await _helper.logTimetoKronos(logDetails, currentIssueId).then((res) => {
                            console.log(res);
                        }).catch((e) => {
                            console.log(e);
                        });
                    }
                } else if(data.statusCode == 400) {
                    alert("Invalid Kronos credentials. Please try again.");
                    return false;
                }
            } else {
                alert("Please sign to kronos using plugin.")
                return false;
            }
        };
        
    }
    

});



