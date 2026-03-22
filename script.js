// script.js

function getISOWeek(date) {
    const d = new Date(date);

    // set to nearest Thursday (ISO week starts Monday)
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));

    const yearStart = new Date(d.getFullYear(), 0, 1);

    const weekNo = Math.ceil(
    ((d - yearStart) / 86400000 + 1) / 7
    );

    return weekNo;
}

function getISOYear(date) {
    const d = new Date(date);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    return d.getFullYear();
}

// main script begins here
// on page load
window.addEventListener("load", async() => {
    // show login screen if user not logged in
    const loginModal = document.getElementById("loginModal");
    const loginBtn = document.getElementById("loginBtn");
    const userDiv = document.getElementById("userDiv");
    const scoreNumDiv = document.getElementById("scoreNumDiv");
    const wordDiv = document.getElementById("wordDiv");
    const clue0Div = document.getElementById("clue0Div");
    const clue1Div = document.getElementById("clue1Div");
    const clue2Div = document.getElementById("clue2Div");
    const btnDivTop = document.getElementById("btnDivTop");
    const btnDivBottom = document.getElementById("btnDivBottom");
    const standingsDiv = document.getElementById("standingsDiv");
    const username = localStorage.getItem("username");
    const playerId = localStorage.getItem("playerId"); 
    
    if(!username) {
        loginModal.style.display = "block";
        return;
    }

    // initialize username and dates
    const getTheDate = new Date();
    const currentDate = getTheDate.toISOString().slice(0, 10);
    const currentWeek = getISOWeek(currentDate);
    const currentYear = getISOYear(currentDate);

    // initialize arrays
    const cluesToReveal =[0];
    const showBtn = {
        clue: 1,
        letter: 1,
        guess: 1
    };
    const todaysScore = {
        playerId: playerId,
        datePlayed: currentDate,
        week: currentWeek,
        year: currentYear
    };

    const res = await fetch("/api/getTodaysWord", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ currentDate })
    });
        const result = await res.json();
        const row = result[0];
        const todaysWord = row.word;
        const todaysClues = {
            clue: {
                0: row.clue0,
                1: row.clue1,
                2: row.clue2
            }
        };
        const todaysLetters = todaysWord.split("");

        // create letter box inputs
        todaysLetters.forEach((_, i) => {
        const input = document.createElement("input");

        input.type = "text";
        input.maxLength = 1;
        input.name = `entry${i}`;
        input.className = "letterBox";

        // move to next input on input
        input.addEventListener("input", () => {
            if (input.value.length === 1) {
            const next = document.querySelector(`[name="entry${i + 1}"]`);
            if (next) next.focus();
            }
        });

        wordDiv.appendChild(input);
        });

        // focus first input
        const first = document.querySelector('[name="entry0"]');
        if (first) first.focus();

        console.log('todaysWord: ', todaysWord);
        console.log(todaysLetters);
        console.log(todaysClues.clue[0]);

    userDiv.textContent = username;
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
    localStorage.setItem("playerId", data.user.player_id);
    document.getElementById("loginModal").style.display = "none";
    location.reload();
});