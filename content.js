
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.evtName === 'logToKronos') {
        const workLog = JSON.parse(request.efforts);
        console.log(workLog)
        let logDetails = {
            timespent: workLog.timeSpent,
            notes: workLog.comment.content[0].content[0].text
        }
        const minutes = getHoursToMinutes(workLog.timeSpent);
        console.log(logDetails);
        logDetails = {
            "time": [
                {
                    "date": "2020-03-16",
                    "pid": 877,
                    "tid": 3,
                    "minute": 480,
                    "note": "Task details",
                    "locId": 9,
                    "billable": true,
                    "onSite": false,
                    "activityRefNumber": "nikunj.beladiya@tarento.com#53a3aadf-9c12-458a-8711-4ef27e232e6d"
                }
            ]
        }
    }
});

function getHoursToMinutes(time) {
    
}