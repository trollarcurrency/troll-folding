function enableBtn() {
    document.getElementById("submitBtn").disabled = false;
}

function disableBtn() {
    document.getElementById("submitBtn").disabled = "disabled";
}

function hide(id) {
    document.getElementById(id).style.display = "none";
}

function show(id) {
    document.getElementById(id).style.display = "";
}

document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById("reg-form");
    form.addEventListener("submit", function(event) {
        var url = "/api";
        var request = new XMLHttpRequest();
        request.open('POST', url, true);
        request.onload = function() {
            var res = JSON.parse(request.responseText);
            if (res.id) {
                document.getElementById("name").textContent = "Name: " + res.id;
                hide("reg-form");
                show("res-display");
            }
        };
        
        request.onerror = function() {
            console.error("Failed to POST /api");
        };

        request.send(new FormData(event.target));

        event.preventDefault();
    });
}, false);