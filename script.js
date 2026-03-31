// script.js

function getISOWeekAndYear() {

    const dateUTC = new Date();
    const dateLocal = dateUTC.toLocaleString('en-ca');

    // split string into yyyy mm dd, then create new date
    const a = dateLocal.split(/\D/);
    const date = new Date(a[0], a[1]-1, a[2]);

    // set date to Thursday of week
    const currentDay = date.getDay();
    const currentYear = date.getFullYear();
    const tempDay = (currentDay + 6) % 7;
    date.setDate(date.getDate() - tempDay + 3);

    // find the first day of the year
    const yearStart = new Date(currentYear, 0, 1);
    
    // find weekNo based on count from first Thursday
    const currentWeek = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    const currentDate = dateLocal.split(',')[0];

    return { currentDate, currentWeek, currentDay, currentYear };
}

function revealClues(todaysClues, cluesToReveal, clueElements) {
    cluesToReveal.forEach((i) => {
        const clueNumberEl = clueElements[i]?.num;
        const clueTextEl = clueElements[i]?.text;

        if (clueNumberEl) {
            clueNumberEl.textContent = i + 1 + '. ';
        }

        if (clueTextEl) {
            clueTextEl.textContent = todaysClues.clue[i];
        }
    });
}

function revealLetters(todaysLetters, lettersToReveal) {
    document.querySelectorAll('input[name^="entry"]').forEach(input => {
        if (!input.classList.contains("locked")) {
            input.value = "";
        }
    });
    
    lettersToReveal.forEach(index => {
        const input = document.querySelector(`input[name="entry${index}"]`);
        
        if (input) {
            input.value = todaysLetters[index]; // reveal the letter
            input.readOnly = true;             // lock the input
            input.classList.add("locked");
        }
    });
}

async function updateScores(todaysScore, lettersToReveal, cluesToReveal) {
    cluesToReveal.forEach(i => {
        const key = `clue${i}Revealed`;
        todaysScore[key] = 1;
    });

    lettersToReveal.forEach(i => {
        const key = `letter${i}Revealed`;
        todaysScore[key] = 1;
    });

    const { playerId, datePlayed, day, week, year, score } = todaysScore;

    await fetch("/api/updateScoreSave", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            playerId,
            datePlayed,
            day,
            week,
            year,
            score,
            todaysScore
        })
    });
}

function btnDisabler(
    todaysScore,
    todaysLetters,
    todaysClues,
    lettersToReveal,
    cluesToReveal,
    buyClueBtn,
    buyLetterBtn,
    guessWordBtn,
    clueElements
) {
    const score = todaysScore.score;
    const totalClues = Object.keys(todaysClues.clue).length;

    // score-based clue restrictions
    if (score < 4 && cluesToReveal.includes(1)) {
        buyClueBtn.disabled = true;
        buyClueBtn.classList = "btnDisable";
    }

    if (score < 3 && cluesToReveal.includes(0)) {
        buyClueBtn.disabled = true;
        buyClueBtn.classList = "btnDisable";
    }

    // score-based letter restriction
    if (score < 3) {
        buyLetterBtn.disabled = true;
        buyLetterBtn.classList = "btnDisable";
    }

    // game over condition
    if (score < 1) {
        msgDiv.textContent = "Game over!";
        guessWordBtn.disabled = true;
        guessWordBtn.classList = "btnDisable";
        todaysScore.finalScore = score;
        // revealLetters(todaysLetters, lettersToReveal);
        // revealClues(todaysClues, cluesToReveal, clueElements);
    }

    // all clues revealed
    if (cluesToReveal.length === totalClues) {
        buyClueBtn.disabled = true;
        buyClueBtn.classList = "btnDisable";
    }

    // all letters revealed
    if (lettersToReveal.length === todaysLetters.length) {
        buyLetterBtn.disabled = true;
        buyLetterBtn.classList = "btnDisable";
    }

    // both fully revealed → disable guessing
    if (
        cluesToReveal.length === totalClues &&
        lettersToReveal.length === todaysLetters.length
    ) {
        guessWordBtn.disabled = true;
        guessWordBtn.classList = "btnDisable";
    }
}

async function loadStandings(currentWeek, currentYear) {

    const resStand = await fetch("/api/getStandings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ currentWeek, currentYear })
    });

    const resultStand = await resStand.json();

    buildStandingsTable(resultStand);
   
}

function buildStandingsTable(data) {

    const standingsTitle = document.getElementById("standingsTitle");
    standingsTitle.textContent = "Standings";

    const dayMap = {
        "1": "M",
        "2": "Tu",
        "3": "W",
        "4": "Th",
        "5": "F"
    };

    // build structure
    const users = {};

    data.forEach(entry => {
        const { username, day, finalScore } = entry;

        if (!users[username]) {
            users[username] = { M: "", Tu: "", W: "", Th: "", F: "" };
        }

        const weekday = dayMap[day];
        if (weekday) {
            users[username][weekday] = finalScore ?? "";
        }
    });

    const table = document.getElementById("scoreTable");

    // header
    table.innerHTML = `
        <tr>
            <th>Player</th>
            <th>M</th>
            <th>Tu</th>
            <th>W</th>
            <th>Th</th>
            <th>F</th>
            <th>Total</th>
        </tr>
    `;

    // precompute + sort users by total descending
    const sortedUsers = Object.entries(users)
        .map(([username, scores]) => {
            const total = Object.values(scores)
                .filter(v => v != null && v !== "")
                .map(Number)
                .reduce((a, b) => a + b, 0);

            return { username, scores, total };
        })
        .sort((a, b) => b.total - a.total);

    const clean = (v) =>
        v == null || v === "" || v === "null" ? "-" : v;

    // render rows
    sortedUsers.forEach(({ username, scores, total }) => {
        const row = `
            <tr>
                <td>${username}</td>
                <td>${clean(scores.M)}</td>
                <td>${clean(scores.Tu)}</td>
                <td>${clean(scores.W)}</td>
                <td>${clean(scores.Th)}</td>
                <td>${clean(scores.F)}</td>
                <td>${total}</td>
            </tr>
        `;

        table.insertAdjacentHTML("beforeend", row);
    });

    standingsDiv.appendChild(table);
}

// main script begins here
// on page load
window.addEventListener("load", async() => {
    
    const titleDiv = document.getElementById("titleDiv");
    const loginModal = document.getElementById("loginModal");
    const loginBtn = document.getElementById("loginBtn");
    const welcomeDiv = document.getElementById("welcomeDiv");
    const userDiv = document.getElementById("userDiv");
    const scoreLabelDiv = document.getElementById("scoreLabelDiv");
    const scoreNumDiv = document.getElementById("scoreNumDiv");
    const wordDiv = document.getElementById("wordDiv");
    const msgDiv = document.getElementById("msgDiv");
    const clueTitleDiv = document.getElementById("clueTitleDiv");
    const clue0DivNum = document.getElementById("clue0DivNum");
    const clue0DivText = document.getElementById("clue0DivText");
    const clue1DivNum = document.getElementById("clue1DivNum");
    const clue1DivText = document.getElementById("clue1DivText");    
    const clue2DivNum = document.getElementById("clue2DivNum");
    const clue2DivText = document.getElementById("clue2DivText");   
    const btnDivTop = document.getElementById("btnDivTop");
    const btnDivBottom = document.getElementById("btnDivBottom");
    const standingsDiv = document.getElementById("standingsDiv");
    const scoringTitle = document.getElementById("scoringTitle");
    const scoringBody = document.getElementById("scoringBody");
    const hr1 = document.getElementById("hr1");
    const hr2 = document.getElementById("hr2");
    const hr3 = document.getElementById("hr3");
    const logout = document.getElementById("logout");
    const username = localStorage.getItem("nymname");
    const playerId = localStorage.getItem("nymId"); 
    
    // show login screen if user not logged in
    if(!username) {
        loginModal.style.display = "block";
        return;

    } else {
        titleDiv.textContent = "nymbleMind";       
        
        // initialize username and dates
        const { currentDate, currentWeek, currentDay, currentYear } = getISOWeekAndYear();

        // if sat or sun, post message and load standings
        if(currentDay === 6 || currentDay === 0) {
            
            try {
                await loadStandings(currentWeek, currentYear);
            
            } catch (err) {
                console.error("Failed to load standings:", err);
            }

            msgDiv.innerHTML = "Enjoy the Weekend and Come Back Monday for Another Game!";
            return;
        }

        // initialize arrays
        const cluesToReveal = [];
        const lettersToReveal = [];
        
        const showBtn = {
            clue: 1,
            letter: 1,
            guess: 1
        };

        const todaysScore = {
            playerId: playerId,
            datePlayed: currentDate,
            day: currentDay,
            week: currentWeek,
            year: currentYear
        };

        const clueElements = {
            0: { num: clue0DivNum, text: clue0DivText },
            1: { num: clue1DivNum, text: clue1DivText },
            2: { num: clue2DivNum, text: clue2DivText },
        };

        // get today's word from database
        const resWord = await fetch("/api/getTodaysWord", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ currentDate })
        });

        const resultWord = await resWord.json();
        const rowWord = resultWord[0];
        const todaysWord = rowWord.word;
        
        const todaysClues = {
            clue: {
                0: rowWord.clue0,
                1: rowWord.clue1,
                2: rowWord.clue2
            }
        };

        const todaysLetters = todaysWord.split("");

        // check to see if user has already played today
        const resScore = await fetch("/api/getTodaysScore", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ currentDate, playerId })
        });

        const resultScore = await resScore.json();
        const rowScore = resultScore[0];
        
        // if game has been started, retrieve game status
        if (rowScore) {
            todaysScore.score = rowScore.score;
            todaysScore.finalScore = rowScore.finalScore;
            
            for (const key in rowScore) {
                if (rowScore[key] !== 1) continue;

                if (key.startsWith("clue")) {
                    cluesToReveal.push(parseInt(key.match(/\d+/)[0]));
                }

                if (key.startsWith("letter")) {
                    lettersToReveal.push(parseInt(key.match(/\d+/)[0]));
                }
            }
        // or set up a new game and write to database
        } else {
            todaysScore.score = 10 + 2 * (todaysLetters.length - 5);
            cluesToReveal.push(0);
            todaysScore.clue0Revealed = 1;

            const resSave = await fetch("/api/initialScoreSave", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ todaysScore })
            });
        };

        // populate screen
        welcomeDiv.textContent = "Welcome,";
        userDiv.textContent = username;
        scoreLabelDiv.textContent = "Score";
        scoreNumDiv.textContent = todaysScore.score;

        // create letter box inputs
        todaysLetters.forEach((_, i) => {
            const input = document.createElement("input");

            input.type = "text";
            input.maxLength = 1;
            input.name = `entry${i}`;
            input.className = "letterBox";

            // move forward on input
            input.addEventListener("input", () => {
                if (input.readOnly) return; // never move focus on locked inputs

                // find the next editable input
                let nextIndex = i + 1;
                while (nextIndex < todaysLetters.length) {
                    const next = document.querySelector(`[name="entry${nextIndex}"]`);
                    if (next && !next.readOnly) {
                        next.focus();
                        break;
                    }
                    nextIndex++;
                }
            });

            // handle backspace
            input.addEventListener("keydown", (e) => {
                if (e.key === "Backspace") {
                    e.preventDefault(); // always handle manually

                    // if current input has value and is editable, clear it
                    if (!input.readOnly && input.value !== "") {
                        input.value = "";
                        return;
                    }

                    // otherwise, move to previous editable input
                    let prevIndex = i - 1;
                    while (prevIndex >= 0) {
                        const prev = document.querySelector(`[name="entry${prevIndex}"]`);
                        if (prev && !prev.readOnly) {
                            prev.value = "";
                            prev.focus();
                            break;
                        }
                        prevIndex--;
                    }
                }
            });
            // focus first input
            const first = document.querySelector('[name="entry0"]');
            if (first) first.focus();

            wordDiv.appendChild(input);
        });
        
        // update screen
        clueTitleDiv.textContent = "Clues";
        revealClues(todaysClues, cluesToReveal, clueElements);
        revealLetters(todaysLetters, lettersToReveal);
        if(todaysScore.finalScore) {
            msgDiv.innerHTML = "Game Over";
        }
        
        // create buy clue button
        const buyClueBtn = document.createElement("button");
        buyClueBtn.classList = "button";
        buyClueBtn.innerHTML = "Buy Clue";

        buyClueBtn.addEventListener("click", async () => {
            buyClueBtn.disabled = true;
            // 2 points for second clue; 3 for third
            const max = Math.max(...cluesToReveal);
            cluesToReveal.push(max + 1);

            if (max == 0) {
                todaysScore.score -= 2; 
            
            } else {
                todaysScore.score -= 3;
            }

            // reveal purchased clue and update game status
            revealClues(todaysClues, cluesToReveal, clueElements);
            scoreNumDiv.textContent = todaysScore.score;
            
            try {
                await updateScores(todaysScore, lettersToReveal, cluesToReveal);
            
            } catch (err) {
                console.error("Failed to save score:", err);
            }

            buyClueBtn.disabled = false;
            btnDisabler(todaysScore, todaysLetters, todaysClues, lettersToReveal, 
                cluesToReveal, buyClueBtn, buyLetterBtn, guessWordBtn, clueElements);
        });
        
        btnDivTop.appendChild(buyClueBtn);

        // create buy letter button
        const buyLetterBtn = document.createElement("button");
        buyLetterBtn.classList = "button";
        buyLetterBtn.innerHTML = "Buy Letter";

        buyLetterBtn.addEventListener("click", async () => {
            buyLetterBtn.disabled = true;            
            // select random letter to reveal that isn't alread revealed for 2 points
            let randomIndex;
            
            do {
                randomIndex = Math.floor(Math.random() * todaysLetters.length);
            } 
            
            while (lettersToReveal.includes(randomIndex));

            lettersToReveal.push(randomIndex);
            todaysScore.score -= 2;

            // reveal purchased letter and update game status
            revealLetters(todaysLetters, lettersToReveal);
            scoreNumDiv.textContent = todaysScore.score
            
            try {
                await updateScores(todaysScore, lettersToReveal, cluesToReveal);
           
            } catch (err) {
                console.error("Failed to save score:", err);
            }
            buyLetterBtn.disabled = false;  
            btnDisabler(todaysScore, todaysLetters, todaysClues, lettersToReveal, 
                cluesToReveal, buyClueBtn, buyLetterBtn, guessWordBtn, clueElements);
        });
        
        btnDivTop.appendChild(buyLetterBtn);
    
        // create guess word button
        const guessWordBtn = document.createElement("button");
        guessWordBtn.classList = "button";
        guessWordBtn.innerHTML = "Guess Word";
        
        guessWordBtn.addEventListener("click", async () => {
            guessWordBtn.disabled = true;
            // check for blanks and combine inputs to wordGuess
            let wordGuess = "";

            for (let i = 0; i < todaysLetters.length; i++) {
                const input = document.querySelector(`[name="entry${i}"]`);

                if (!input || input.value.trim() === "") {
                    guessWordBtn.disabled = false;
                    alert("Please fill in all letters before guessing.");
                    return;
                }

                wordGuess += input.value.toLowerCase();
            }
            
            // compare guess to answer; incorrect guess cost 2 points
            if (wordGuess !== todaysWord.toLowerCase()) {
                todaysScore.score -= 2;

                // game over condition
                if (todaysScore.score <= 0) {
                    todaysScore.score = 0;
                    todaysScore.finalScore = todaysScore.score;
                    msgDiv.textContent = "Game Over";

                    // reveal all clues and letters if game is over
                    for (let i = 0; i < todaysLetters.length; i++) {
                        if (!lettersToReveal.includes(i)) {
                            lettersToReveal.push(i);
                        }
                    }

                    Object.keys(todaysClues.clue).forEach(key => {
                        const index = parseInt(key);

                        if (!cluesToReveal.includes(index)) {
                            cluesToReveal.push(index);
                        }
                    });
                }

                scoreNumDiv.textContent = todaysScore.score;
                msgDiv.innerHTML = "Incorrect guess!";

            } else {
                msgDiv.innerHTML = "Correct!";
                todaysScore.finalScore = todaysScore.score;
                
                // reveal all clues and letters if guess is correct
                for (let i = 0; i < todaysLetters.length; i++) {
                    if (!lettersToReveal.includes(i)) {
                        lettersToReveal.push(i);
                    }
                }

                Object.keys(todaysClues.clue).forEach(key => {
                    const index = parseInt(key);

                    if (!cluesToReveal.includes(index)) {
                        cluesToReveal.push(index);
                    }
                });
            }
            
            // update game status
            try {
                await updateScores(todaysScore, lettersToReveal, cluesToReveal);
            
            } catch (err) {
                console.error("Failed to save score:", err);
            }

            try {
                await loadStandings(currentWeek, currentYear);
            
            } catch (err) {
                console.error("Failed to load standings:", err);
            }

            guessWordBtn.disabled = false;
            btnDisabler(todaysScore, todaysLetters, todaysClues, lettersToReveal, 
                cluesToReveal, buyClueBtn, buyLetterBtn, guessWordBtn, clueElements);

            revealLetters(todaysLetters, lettersToReveal);
            revealClues(todaysClues, cluesToReveal, clueElements);
        });

        btnDivBottom.appendChild(guessWordBtn);
        
        // set initial button status
        btnDisabler(todaysScore, todaysLetters, todaysClues, lettersToReveal, 
            cluesToReveal, buyClueBtn, buyLetterBtn, guessWordBtn, clueElements);
        
        hr1.classList.add("lines");

        // load standings
        try {
            await loadStandings(currentWeek, currentYear);
        
        } catch (err) {
           console.error("Failed to load standings:", err);
        }

        hr2.classList.add("lines");

        // show scoring table
        scoringTitle.textContent = "Scoring";
        const table = document.createElement("table");
        table.innerHTML = `
            <tr><td>Clue 1</td><td> - </td><td>Free!</td></tr>
            <tr><td>Clue 2</td><td> - </td><td>2 points</td></tr>
            <tr><td>Clue 3</td><td> - </td><td>3 points</td></tr>
            <tr><td>Letters</td><td> - </td><td>2 points each</td></tr>
            <tr><td>Bad Guess</td><td> - </td><td>2 points</td></tr>
        `;
        scoringBody.appendChild(table);
        hr3.classList.add("lines");

        // logout button
        const logoutBtn = document.createElement("button");
        logoutBtn.classList = "button";
        logoutBtn.innerHTML = "Logout";
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem('nymname');
            localStorage.removeItem('nymId');
            location.reload();
        });
        logout.appendChild(logoutBtn);
    }; 
});

// splash screen fadeaway
window.addEventListener("load", () => {
    setTimeout(() => {
        const splash = document.getElementById("splash");
        splash.style.opacity = "0";

        setTimeout(() => {
            splash.style.display = "none";
            page.style.display = "block";
        }, 500);
    }, 3000);
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
    localStorage.setItem("nymname", data.user.username);
    localStorage.setItem("nymId", data.user.playerId);
    document.getElementById("loginModal").style.display = "none";
    location.reload();
});