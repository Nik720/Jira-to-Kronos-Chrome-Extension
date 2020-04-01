import * as moment from 'moment';
import * as $ from 'jquery';

export default class Helper {
    public currentIssueid: String;
    public projectMetaData: any;

    constructor() {
        this.currentIssueid = ""
        this.projectMetaData = {};
        this.checkLocalStorage();
    }

    public checkLocalStorage = async() => {
        if(localStorage.getItem('thisProjectMetaData')) {
            const thisProjectMetaData = localStorage.getItem('thisProjectMetaData');
            this.projectMetaData = JSON.parse(thisProjectMetaData);
        }
    }

    public authenticate = async(userDetails: any) => {
        return new Promise((resolve, reject) => {
            $.ajax({
                url : "https://kronos.idc.tarento.com/api/v1/user/login",
                type: "POST",
                contentType: 'application/json; charset=utf-8',
                data : JSON.stringify(userDetails),
                dataType: 'json',
                success: async(data, textStatus, jqXHR) => {
                    if(data.statusCode === 200) {
                        await this.setChromeStorageData({authToken: data.responseData.sessionId}).then((res) => {
                            resolve(data);
                        })
                    }
                },
                error: function(e) {
                    reject(e);
                }
            });
        })
    }

    public getChromeStorageData = async(itemSets) => {
        return new Promise(function (resolve, reject) {
            chrome.storage.sync.get(itemSets, (items) => {
                if(items) {
                    resolve(items);
                } else {
                    reject("error")
                }
            });
        });
    }

    public setChromeStorageData = async(itemset) => {
        return new Promise(function (resolve, reject) {
            chrome.storage.sync.set(itemset, () => {
                resolve(true);
            });
        });
    }

    public uuidv4 = async() => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    public getHoursToMinutes = async(time) => {
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

    public logTimetoKronos = async(logDetails, currentIssueId?: any) => {
        this.currentIssueid = (currentIssueId) ? currentIssueId : '';
        const items: any = await this.getChromeStorageData({ 
            email: '', authToken: '',
        }).then((item) => {
            return item
        });
        let authToken="";
        if(items) {
            authToken = items.authToken
            logDetails.time[0].activityRefNumber = `${items.email}#${await this.uuidv4()}`;
        }

        return new Promise((resolve, reject) => {
            $.ajax({
                url : "https://kronos.idc.tarento.com/api/v1/user/saveTaskTimeForProjectFeature",
                type: "POST",
                contentType: 'application/json; charset=utf-8',
                data : JSON.stringify(logDetails),
                dataType: 'json',
                headers: {
                    "Authorization": authToken
                },
                success: async(data) => {
                    if(data.statusCode === 401) {
                        await this.reAuthenticate(this.logTimetoKronos(logDetails, currentIssueId))
                    } else if(data.statusCode === 320) {
                        alert(`This particular date ${logDetails.time[0].date}  is locked in kronos. Please add time log manually in kronos.`)
                        return false;
                    } else if(data.statusCode === 200) {
                        resolve(await this.handleLoggedTaskList(logDetails));
                    }
                },
                error: async(jqXHR) => {
                    reject(jqXHR);
                }
            });
        })
    }

    public handleLoggedTaskList = async(logDetails) => {
        const items: any = await this.getChromeStorageData({ loggedTaskList: '' }).then((item) => { return item });
        if (items) {
            var parsedTime = {
                currentDate: moment().format('YYYY-MM-DD'),
                list: []
            };
            if(items.loggedTaskList !== "") {
                const loggedTask = JSON.parse(items.loggedTaskList)
                parsedTime = (loggedTask.currentDate === moment().format('YYYY-MM-DD')) ? loggedTask : parsedTime
            }
            (this.currentIssueid) ? logDetails.time[0].issueId = this.currentIssueid: '';
            parsedTime.list.push(logDetails.time[0]);
            const isDataStored = await this.setChromeStorageData({
                loggedTaskList: JSON.stringify(parsedTime)
            }).then((res) => { return res; })
            if(isDataStored) {
                return true;
            }
        };
    }

    public reAuthenticate = async(callBackFn) => {
        const items:any = await this.getChromeStorageData({
            email: '',
            password: ''
        }).then((res) => {return res;})
        if(items) {
            const userDetails = {
                "username": items.email,
                "password": items.password
            }
            this.authenticate(userDetails).then((res:any) => {
                if(res.statusCode == 200) {
                    callBackFn();
                }
            });
        }
        
    }

    public fetchAllProjectDetails = async() => {
        const fdata = {};
        const items:any = await this.getChromeStorageData({
            email: '',
            password: '',
            authToken: '',
        }).then((res) => {return res;})
        if(items) {
            let authToken = items.authToken
            return new Promise((resolve, reject) => {
                $.ajax({
                    url : "https://kronos.idc.tarento.com/api/v1/user/getAllProjectTask",
                    type: "POST",
                    contentType: 'application/json',
                    data: JSON.stringify(fdata),
                    headers: {
                        "Authorization": authToken
                    },
                    success: async (data) => {
                        if(data.statusCode === 401) {
                            await this.reAuthenticate(this.fetchAllProjectDetails)
                        }else if(data.statusCode === 200) {
                            const resData = data.responseData;
                            this.projectMetaData = resData;
                            localStorage.setItem("thisProjectMetaData", JSON.stringify(this.projectMetaData));
                            resolve(this.projectMetaData);
                        }
                    },
                    error: function (jqXHR)
                    {
                        reject(jqXHR);
                    }
                });
            })
            
        }
        
    }

    public setProjectOptionList = async() => {
        var projectOptions = "<option value=''>Select Projects</option>";
        this.projectMetaData.projectList.forEach(project => {
          projectOptions += `<option value="${project.id}" }>${project.name}</option>`;
        });
        return projectOptions;
    }

    public setTaskOptionList = async(selectedProject:any, taskId?:any) => {
        const taskList = this.projectMetaData.projectTaskMap.filter((item) => {
            return item.projectId == selectedProject
        });
        const items:any = await this.getChromeStorageData({task: ''}).then((res) => { return res;});
        if(taskId && taskId !== "") {
            items.task = taskId;
        }
        const taskArrayIds = taskList[0].taskList;
        var taskOptions = "<option value=''>Select Task</option>";
        this.projectMetaData.taskList.forEach(task => {
            if(taskArrayIds.includes(task.id)) {
                taskOptions += `<option value="${task.id}" ${(items.task && items.task == task.id) ? 'selected' : ''}>${task.name}</option>`;
            }
        });
        return taskOptions;
    }

    public minutesToHHMM = async(minutes:any) => {
        let hours = Math.floor(minutes / 60);  
        let min = minutes % 60;
        return `${hours}H ${min}M`;
    }

    public updateTask = async(tdetails, newTaskid) => {
        const items:any = await this.getChromeStorageData({authToken: ''}).then((res) => { return res; });
        if(items.authToken) {
            let authToken = items.authToken
            let oldTask = JSON.parse(tdetails);
            oldTask.tid = newTaskid;
            delete oldTask.issueId;
            return new Promise((resolve, reject) => {
                $.ajax({
                    url : "https://kronos.idc.tarento.com/api/v1/user/updateTaskTimeForProjectFeature",
                    type: "POST",
                    contentType: 'application/json; charset=utf-8',
                    data : JSON.stringify({'time': [oldTask]}),
                    dataType: 'json',
                    headers: {
                        "Authorization": authToken
                    },
                    success: async(data) => {
                        if(data.statusCode === 200) {
                            const items:any = await this.getChromeStorageData({'loggedTaskList': ''}).then(res => {return res;});
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
                                const isDataStored = await this.setChromeStorageData({
                                    loggedTaskList: JSON.stringify(loggedTask)
                                }).then((res) => { return res; })
                                if(isDataStored) {
                                    resolve(true);
                                }
                            }
                        }
                    },
                    error: function (jqXHR)
                    {
                        reject(jqXHR)
                    }
                });
            })
        }
    }
}