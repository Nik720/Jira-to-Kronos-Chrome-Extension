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
            $("#logTbl").find('tbody').html('');
            var totalLoggedTimes:number = 0;
            loggedListJson.list.forEach(async list => {
                const optionList = await _helper.setTaskOptionList(list.pid, list.tid);
                let trLog = `<tr>`;
                trLog += `<td>${(list.issueId) ? list.issueId : '-'}</td>`;
                trLog += `<td><select id="taskList${list.tid}" class="taskLists" data-loggedTask='${JSON.stringify(list)}'>
                            ${optionList}
                            </select>
                            </td>`;
                trLog += `<td>${await _helper.minutesToHHMM(list.minute)}</td>`;
                trLog += `<td>${list.note}</td>`;
                trLog += `</tr>`;
                totalLoggedTimes += parseInt(list.minute);
                $("#logTbl").find('tbody').append(trLog);
                $('#totalLoggedTime').html(await _helper.minutesToHHMM(totalLoggedTimes));
            });
            
        } else {
            $("#logTbl").find('tbody').html('');
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
        
        var data:any = await _helper.authenticate(userDetails);
        if(data.statusCode == 200) {
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
        });
        $("#newProjects").on('change', async(_e) => {
            const selectedProject = (_e.currentTarget as HTMLSelectElement).value;
            if($("#newProjects").val() !== '') {
              const optionList:any = await _helper.setTaskOptionList(selectedProject);
              $("#newTasks").html(optionList);
            }
        });

        $("#saveNewTask").on('click', async() => {
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
                const result = await _helper.logTimetoKronos(logDetails);
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

        $(document).on('change', '.taskLists', async (_e) => {
            let oldLoggedTask = _e.currentTarget.getAttribute('data-loggedTask');
            let newTaskid = _e.currentTarget.value;
            $("#loader").show();
            const status = await _helper.updateTask(oldLoggedTask, newTaskid);
            if(status == true){
                $("#loader").hide(); 
                restoreOptions();
            }
        });

    })

    $(restoreOptions);
});


