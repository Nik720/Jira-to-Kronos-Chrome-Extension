import * as moment from 'moment';
import * as $ from 'jquery';
import Helper from './helper';

$(function() {
    const _helper = new Helper();

    const restoreOptions = async() => {
        const csData: any = await _helper.getChromeStorageData({
            email: '',
            password: '',
            loggedTaskList: ''
        }).then((item) => {
            return item
        });
        if(csData.email != '' && csData.password != '') {
            $("#email").val(csData.email);
            $("#password").val(csData.password);
            $("#loggedMsg").show();
            $("#login").hide();
            $("#editDetails").show();
            $('#totalLoggedTime').html('0H 0M');
            if(csData.loggedTaskList !== "") {
                await prepareTaskTable(csData.loggedTaskList)
            }
            $("#editDetails").show();
            $("#logList").hide();
        } else {
            await toogleBlock();
            $("#logList").hide();
        }
    }

    const prepareTaskTable = async(loggedList:any) => {
        const loggedListJson = JSON.parse(loggedList);
        if(loggedListJson.currentDate === moment().format('YYYY-MM-DD')) {
            $("#taskCards").html('');
            var totalLoggedTimes:number = 0;
            loggedListJson.list.forEach(async list => {

                const projectName = _helper.projectMetaData.projectList.find(project => {
                    return project.projectCode === list.pid;
                });
                const taskName = _helper.projectMetaData.taskList.find(task => {
                    return task.id == list.tid;
                });
                let taskcard = `<div class="taskCard">
                                    <div class="taskSection">
                                    <p class="taskName">${taskName.name}</p>
                                    <div class="projectName">${projectName.name}</div>
                                    </div>
                                    <div class="projectTimeSection">
                                    <p class="ticketId" style="display:${(list.issueId) ? 'block' : 'none'}">${(list.issueId) ? list.issueId : '-'}</p>
                                    <div class="loggedTime">${await _helper.minutesToHHMM(list.minute)}</div>
                                    <button class="editBtn" data-taskDetails='${JSON.stringify(list)}'>Edit</button>
                                    </div>
                                    <div class="clear"></div>
                                </div>`;

                totalLoggedTimes += parseInt(list.minute);
                $("#taskCards").append(taskcard);
                $('#totalLoggedTime').html(await _helper.minutesToHHMM(totalLoggedTimes));
            });
            
        } else {
            let taskcard = `<div class="taskCard">
                                <div class="taskSection">
                                    <p class="taskName">Please add your time logs to Jira or add manually using above Add button</p>
                                </div>
                                <div class="clear"></div>
                            </div>`;
            $("#taskCards").html(taskcard);
        }
        $("#loader").hide();
    }
    
    const toogleBlock = async() => {
        $("#login").show();
        $("#addTaskSec").hide();
        $("#loggedMsg").hide();
        $("#editDetails").hide();
        $("#logList").show();
    }

    const saveOptions = async() => {
        var email = $("#email").val();
        var password = $("#password").val();
        var trntoKns = $("#trntoKns").prop("checked");
        var trt_email = $("#trt_email").val();
        var trt_password = $("#trt_password").val();
        _helper.setChromeStorageData({trntoKns: trntoKns}).then((res) => { return res; });
        if(email == '') {
            return setValidationMsg('email','Email address is required');
        } else if(await IsEmail(email) == false){
            return setValidationMsg('email','Please enter a valid email address');
        } else if(password == '') {
            return setValidationMsg('password','Password is required');
        }
        const userDetails = {
            "username": email,
            "password": password
        };
        const trt_userDetails = {
            "username": trt_email,
            "password": trt_password
        };
        
        var data:any = await _helper.authenticate(userDetails);
        if(trntoKns) {
            var trt_data:any = await _helper.authenticate(trt_userDetails);
            if(trt_data.statusCode == 400) {
                $("#loggedErr").show();
                setTimeout(function () {
                    $("#loggedErr").hide();
                }, 3000);
                return false;
            }else if(trt_data.statusCode==200) {
                const authToken = trt_data.responseData.sessionId
                _helper.setChromeStorageData({
                    trt_email: userDetails.username,
                    trt_password: userDetails.password,
                    trt_authToken: authToken
                }).then((res) => { return res; })
            }
        }
        if(data.statusCode == 200 ) {
            const authToken = data.responseData.sessionId
            const setDataToSotage = _helper.setChromeStorageData({
                email: userDetails.username,
                password: userDetails.password,
                authToken: authToken
            }).then((res) => { return res; })
            if(setDataToSotage) {
                var status = document.getElementById('status');
                status.textContent = 'Email address and password saved.';
                setTimeout(function () {
                    status.textContent = '';
                    window.close();
                    chrome.tabs.create({ url: "options.html" });
                }, 750);
            }
        } else if(data.statusCode == 400) {
            $("#loggedErr").show();
            setTimeout(function () {
                $("#loggedErr").hide();
            }, 3000);
            return false;
        }
    }

    const setValidationMsg = async (selector,errMsg) => {
        $(".form-group").removeClass("has-error").find(".error").html("");
        $('#'+selector).parent(".form-group").addClass("has-error").find(".error").html(errMsg);
        return false;
    }
    
    const IsEmail = async (email) => {
        var regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        if(!regex.test(email)) {
          return false;
        }else{
          return true;
        }
    }

    const resetNewTaskForm = async() => {
        $("#newTasks").val('');
        $("#nTHours").val('');
        $("#nTMinutes").val('');
        $("#details").val('');
        $("#loader").hide();
    }


    $(document).ready(function(){
        $("#save").on('click', async() => {
            await saveOptions();
        });
        $("#editDetails").on('click', async() => {
            await toogleBlock();
        });
        $("#logList").on('click', async() =>{
            $("#login").hide();
            $("#logList").hide();
            $("#loggedMsg").show();
            $("#editDetails").show();
        });
        $("#addNewTaskBtn").on('click', async() => {
            $("#loggedMsg").hide();
            $("#addTaskSec").show();
            await resetNewTaskForm();
            const items:any = await _helper.getChromeStorageData({
                task: '',
                project: ''
            }).then(res => {return res;});
            $("#newProjects").html(await _helper.setProjectOptionList());
            (items.project !== '') ? $("#newProjects").val(items.project).change() : '';
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
            $("#saveNewTask").html("Save").attr('data-action', 'save');
        });
        $("#newProjects").on('change', async(_e) => {
            const selectedProject = (_e.currentTarget as HTMLSelectElement).value;
            if($("#newProjects").val() !== '') {
                let taskid = undefined;
                const btnAction = $("#saveNewTask").attr('data-action');
                if(btnAction == 'update') {
                    taskid =  $("#newTasks").attr('data-selectedTask');
                }
              const optionList:any = await _helper.setTaskOptionList(selectedProject, taskid);
              $("#newTasks").html(optionList);
            }
        });

        $("#saveNewTask").on('click', async(_e) => {
            let btnAction = _e.currentTarget.getAttribute('data-action');
            let project = $("#newProjects").val();
            let task = $("#newTasks").val();
            let hours = $("#nTHours").val();
            let minutes = $("#nTMinutes").val();
            let details = $("#details").val();
            if(project !== "" && task !== "" && hours !== "" && minutes !== "" && details !== "") {
                $("#loader").show();
                const logDetails = {
                    "time": [
                        {
                            "date": moment().format('YYYY-MM-DD'),
                            "pid": project,
                            "tid": task,
                            "fid": 230,
                            "minute": await _helper.getHoursToMinutes(`${hours} ${minutes}`),
                            "note": details,
                            "locId": null,
                            "billable": true,
                            "onSite": false,
                            "activityRefNumber": await _helper.uuidv4()
                        }
                    ]
                }
                let result;
                if(btnAction == 'update') {
                    const actRefNum = (<HTMLInputElement>document.getElementById('activiryRefNum')).value;
                    logDetails.time[0].activityRefNumber = actRefNum;
                    result = await _helper.updateTask(logDetails);
                } else {
                    result = await _helper.logTimetoKronos(logDetails);
                } 

                if(result) {
                    $("#cancelFrmBtn").click();
                    $("#loader").hide();
                    await restoreOptions();
                }
            } else {
                $("#errStatus").html("Please fill all the require field").show();
                setTimeout(() => {
                    $("#errStatus").html("").hide();
                }, 3000);
            }
        })

        $("#cancelFrmBtn").on('click', async() => {
            $("#loggedMsg").show();
            $("#addTaskSec").hide();
        })

        $(document).on('click', '.editBtn', async (_e) => {
            let loggedTask = _e.currentTarget.getAttribute('data-taskDetails');
            loggedTask = JSON.parse(loggedTask);
            const loggedTime = await _helper.minutesToHHMM(loggedTask.minute)
            const hours = loggedTime.split(' ')[0];
            const minutes = loggedTime.split(' ')[1];
            
            $("#newTasks").attr('data-selectedTask', loggedTask.tid);
            $("#saveNewTask").html("Update").attr('data-action', 'update');
            $("#loggedMsg").hide();
            $("#addTaskSec").show();
            await resetNewTaskForm();
            $("#newProjects").html(await _helper.setProjectOptionList());
            $("#newProjects").val(loggedTask.pid).change();
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

            $("#nTHours").val(hours.toLowerCase());
            $("#nTMinutes").val(minutes.toLowerCase());
            $("#details").val(loggedTask.note);
            $("#activiryRefNum").val(loggedTask.activityRefNumber);

        });

        $("#trntoKns").on('click', function(){
            if($(this).prop("checked")) {
                $("#trt_login_frm").show();
            } else {
                $("#trt_login_frm").hide();
            }
        })

    })

    $(restoreOptions);
});


