console.log('Starting extension');
// https://project-sunbird.atlassian.net/rest/internal/3/issue/SB-17767/worklog?adjustEstimate=auto

var requestFilter = { urls: ['<all_urls>'] };
var extraInfoSpec = ['requestBody'];

const networkFilters = {
    urls: [
        "*://project-sunbird.atlassian.net/*"
    ]
};
chrome.webRequest.onBeforeRequest.addListener((details) => {
    if(details.method === 'POST') {
        var togglRequest = details.url.indexOf('worklog') > -1;
        if(togglRequest) {
            var postedString = decodeURIComponent(String.fromCharCode.apply(null,
            new Uint8Array(details.requestBody.raw[0].bytes)));
            console.log(postedString)
            const requestMessage = {
                evtName: "logToKronos", 
                efforts: postedString,
                url: details.url
            }
            chrome.tabs.query({active: true, currentWindow: true},function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, requestMessage);
            });
        }
    }
}, networkFilters, extraInfoSpec);

