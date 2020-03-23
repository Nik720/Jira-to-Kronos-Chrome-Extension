// Saves options to chrome.storage
function saveOptions() {
    var email = $("#email").val();
    var password = $("#password").val();
    
    if(email == '') {
        return setValidationMsg('email','Email address is required');
    } else if(IsEmail(email) == false){
        return setValidationMsg('email','Please enter a valid email address');
    } else if(password == '') {
        return setValidationMsg('password','Password is required');
    }
    const userDetails = {
        "username": email,
        "password": password
    }
    $.ajax({
        url : "https://kronos.idc.tarento.com/api/v1/user/login",
        type: "POST",
        contentType: 'application/json; charset=utf-8',
        data : JSON.stringify(userDetails),
        dataType: 'json',
        success: function(data, textStatus, jqXHR)
        {
            if(data.statusCode == 200) {
                userDetails.authToken = data.responseData.sessionId
                saveCredentials(userDetails);
            } else if(data.statusCode == 400) {
                $("#loggedErr").show();
                setTimeout(function () {
                    $("#loggedErr").hide();
                }, 1000);
                return false;
            }
        }
    });
}

async function saveCredentials(data) {
    chrome.storage.sync.set({
        email: data.username,
        password: data.password,
        authToken: data.authToken
    }, function () {
        var status = document.getElementById('status');
        status.textContent = 'Email address and password saved.';
        setTimeout(function () {
            status.textContent = '';
            window.close();
            chrome.tabs.create({ url: "options.html" });
        }, 750);
    });
}

async function setValidationMsg(selector,errMsg) {
    $(".form-group").removeClass("has-error").find(".error").html("");
    $('#'+selector).parent(".form-group").addClass("has-error").find(".error").html(errMsg);
    return false;
}

async function IsEmail(email) {
    var regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if(!regex.test(email)) {
      return false;
    }else{
      return true;
    }
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
    // Use default values
    chrome.storage.sync.get({
        email: '',
        password: '',
    }, function (items) {
        document.getElementById('email').value = items.email ? items.email : '';
        document.getElementById('password').value = items.password ? items.password : '';
        if(items.email != '' && items.password != '') {
            $("#loggedMsg").show();
            $("#login").hide();
        } else {
            $("#loggedMsg").hide();
            $("#login").show();
        }
    });
}

function toogleBlock() {
    $("#loggedMsg,#login").toggle();
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('editDetails').addEventListener('click', toogleBlock);