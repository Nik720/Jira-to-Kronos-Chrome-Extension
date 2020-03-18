// Saves options to chrome.storage
function saveOptions() {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
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
