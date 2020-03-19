// Saves options to chrome.storage
function saveOptions() {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    if (email !== "" && password !== "") {
        chrome.storage.sync.set({
            email: email,
            password: password,
        }, function () {
            // Update status to let user know options were saved.
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
                        var status = document.getElementById('status');
                        status.textContent = 'Email address and password saved.';
                        setTimeout(function () {
                            status.textContent = '';
                            window.close();
                        }, 750);
                    } else if(data.statusCode == 400) {
                        alert("Invalid Kronos credentials. Please try again.");
                        return false;
                    }
                }
            });
        });
    } else {
        alert("Kronos credentials should not empty")
        return false; 
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
        if(items.email !== '' && items.password !== '') {
            document.getElementById('isUserCredSaved').innerText = "User credentials are already saved.";
        }
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
