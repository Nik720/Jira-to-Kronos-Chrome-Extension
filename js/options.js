(function () {
    var projectMetaData = "";
    $(document).ready(function(){
        chrome.storage.sync.get({
            email: '',
            password: '',
            authToken: '',
        }, function(items) {
            fetchAllprojectDetails(items)
        });

        $("#projects").on('change', function(e){
            const selectedProject = this.value;
            const taskList = projectMetaData.projectTaskMap.filter((item) => {
                return item.projectId == selectedProject
            });
            const taskArrayIds = taskList[0].taskList;
            var taskOptions = "<option value=''>Select Task</option>";
            projectMetaData.taskList.forEach(task => {
                if(taskArrayIds.includes(task.id)) {
                    taskOptions += `<option value="${task.id}" >${task.name}</option>`;
                }
            });
            $("#tasks").html(taskOptions);
        }); 
    });

    async function fetchAllprojectDetails() {
        const fdata = {};
        chrome.storage.sync.get({
            email: '',
            password: '',
            authToken: '',
        }, async function(items) {
            let authToken = items.authToken
            $.ajax({
                url : "https://kronos.idc.tarento.com/api/v1/user/getAllProjectTask",
                type: "POST",
                contentType: 'application/json',
                data: JSON.stringify(fdata),
                headers: {
                    "Authorization": authToken
                },
                success: function(data)
                {
                    if(data.statusCode === 200) {
                        const resData = data.responseData;
                        projectMetaData = resData;
                        var projectOptions = "<option value=''>Select Projecrt</option>";
                        resData.projectList.forEach(project => {
                            projectOptions += `<option value="${project.projectCode}" >${project.name}</option>`;
                        });
                        resData.taskList.forEach(task => {
                            
                        });
                        $("#projects").html(projectOptions);
                        $('.loader').hide();
                    }
                },
                error: function (jqXHR)
                {
                    console.log("error while adding logs to kronos. ",jqXHR);
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', restoreOptions);
    document.getElementById('save').addEventListener('click', saveOptions);

    function saveOptions() {

        var project = document.getElementById('projects').value;
        var task = document.getElementById('tasks').value;

        chrome.storage.sync.set({
            project: project,
            task: task
        }, function() {
            alert("Details are saved !!");
            window.close();
        });
    }

    function restoreOptions() {

    }
    
})(); 