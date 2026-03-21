// script.js

// main script begins here
const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const username = localStorage.getItem("username");

// on page load
window.addEventListener("load", async() => {
    // show login screen if user not logged in
    if(!username) {
        loginModal.style.display = "block";
        return;
    }
});

// on 'login' button click
loginBtn.addEventListener("click", async () => {
    const inputEmail = document.getElementById("inputEmail").value;
    const inputPassword = document.getElementById("inputPassword").value;

    // call the backend js
    const loginRes = await fetch("/api/loginLogic", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ inputEmail, inputPassword })
    });

    // process the returned data
    const data = await loginRes.json();
    if (!loginRes.ok) {
        document.getElementById("loginError").textContent = data.error;
        return;
    }
    
    // save the date in local storage and reload page
    localStorage.setItem("username", data.user.username);
    localStorage.setItem("userId", data.user.id);
    document.getElementById("loginModal").style.display = "none";
    location.reload();
});