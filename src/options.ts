import * as $ from 'jquery';
import Helper from './helper';

(function () {
  const _helper = new Helper();
  $(document).ready(async() => {
      if(Object.keys(_helper.projectMetaData).length <= 0) {
        await fetchAllprojectDetails();
      }
      await loadProjectList();
      $("#projects").on('change', async(_e) => {
          const selectedProject = (_e.currentTarget as HTMLSelectElement).value;
          if($("#projects").val() !== '') {
            const optionList:any = await _helper.setTaskOptionList(selectedProject);
            $("#tasks").html(optionList);
          }
      }); 

      $("#save").on('click', async() => {
        await saveOptions()
      })
      const items:any = await _helper.getChromeStorageData({project: '', task: ''}).then((res) => { return res; });
      if(items.project && items.project !== ''){
        $("#projects").val(items.project).change();
      }
  });

  const fetchAllprojectDetails = async() => {
    await _helper.fetchAllProjectDetails().then((_res) => {
      console.log(_helper.projectMetaData);
    }).catch((e) => {
      console.log(e);
    })
  }

  const loadProjectList = async() => {
    $("#projects").html(await _helper.setProjectOptionList());
    $('.loader').hide();
  }

  const saveOptions = async() => {
      var project = $('#projects').val();
      var task = $('#tasks').val();
      const isDetailsSaved = await _helper.setChromeStorageData({
        project: project,
        task: task
      }).then((res) => { return res; });
      if(isDetailsSaved) {
        alert("Details are saved !!");
        window.close();
      }
  }
  
})(); 