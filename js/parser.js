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

    chrome.storage.sync.set({
        email: email,
        password: password,
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Email address and password saved.';
        setTimeout(function () {
            status.textContent = '';
            window.close();
        }, 750);
        
    });
}

function setValidationMsg(selector,errMsg) {
    $(".form-group").removeClass("has-error").find(".error").html("");
    $('#'+selector).parent(".form-group").addClass("has-error").find(".error").html(errMsg);
    return false;
}

function IsEmail(email) {
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
        
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
