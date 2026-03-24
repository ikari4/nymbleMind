// script.js


function getISOWeekAndYear(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);

    // Create UTC date
    const date = new Date(Date.UTC(year, month - 1, day));

    // Shift to nearest Thursday (ISO rule)
    const tempDate = new Date(date);
    tempDate.setUTCDate(tempDate.getUTCDate() + 3 - ((tempDate.getUTCDay() + 6) % 7));

    const currentYear = tempDate.getUTCFullYear();

    // First Thursday of ISO year
    const firstThursday = new Date(Date.UTC(currentYear, 0, 4));
    firstThursday.setUTCDate(
        firstThursday.getUTCDate() + 3 - ((firstThursday.getUTCDay() + 6) % 7)
    );

    const currentWeek = 1 + Math.round(
        (tempDate - firstThursday) / (7 * 24 * 60 * 60 * 1000)
    );

    return { currentYear, currentWeek };
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

    const { playerId, datePlayed, week, year, score } = todaysScore;

    await fetch("/api/updateScoreSave", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            playerId,
            datePlayed,
            week,
            year,
            score,
            // send the full score object (already camelCase)
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
    guessWordBtn
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
        alert("Game Over");
        guessWordBtn.disabled = true;
        guessWordBtn.classList = "btnDisable";
        todaysScore.finalScore = score;
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

function buildStandingsTable(data) {
    // data = array of score objects

    const table = document.createElement("table");

    // Get unique dates
    const dates = [...new Set(data.map(d => d.datePlayed))].sort();

    // Get unique players
    const players = [...new Set(data.map(d => d.playerId))];

    // ----- HEADER -----
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const thPlayer = document.createElement("th");
    thPlayer.textContent = "Player";
    headerRow.appendChild(thPlayer);

    dates.forEach(date => {
        const th = document.createElement("th");
        th.textContent = date;
        headerRow.appendChild(th);
    });

    const thTotal = document.createElement("th");
    thTotal.textContent = "Total";
    headerRow.appendChild(thTotal);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // ----- BODY -----
    const tbody = document.createElement("tbody");

    players.forEach(playerId => {
        const row = document.createElement("tr");

        // Player cell
        const tdPlayer = document.createElement("td");
        tdPlayer.textContent = playerId;
        row.appendChild(tdPlayer);

        let total = 0;

        // Score cells per date
        dates.forEach(date => {
            const td = document.createElement("td");

            const match = data.find(
                d => d.playerId === playerId && d.datePlayed === date
            );

            if (match) {
                td.textContent = match.finalScore;
                total += match.finalScore;
            } else {
                td.textContent = "-";
            }

            row.appendChild(td);
        });

        // Total cell
        const tdTotal = document.createElement("td");
        tdTotal.textContent = total;
        row.appendChild(tdTotal);

        tbody.appendChild(row);
    });

    table.appendChild(tbody);

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
    const scoreBody1 = document.createElement("div");
    const scoreBody2 = document.createElement("div");
    const scoreBody3 = document.createElement("div");
    const scoreBody4 = document.createElement("div");
    const scoreBody5 = document.createElement("div");
    const username = localStorage.getItem("username");
    const playerId = localStorage.getItem("playerId"); 
    
    // show login screen if user not logged in
    if(!username) {
        loginModal.style.display = "block";
        return;
    } else {
        titleDiv.textContent = "nymbleMind";       
        
        // initialize username and dates
        const getTheDate = new Date();
        const currentDate = getTheDate.toISOString().slice(0, 10);
        const { currentYear, currentWeek } = getISOWeekAndYear(currentDate);

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
            for (const key in rowScore) {
                if (rowScore[key] !== 1) continue;

                if (key.startsWith("clue")) {
                    cluesToReveal.push(parseInt(key.match(/\d+/)[0]));
                }

                if (key.startsWith("letter")) {
                    lettersToReveal.push(parseInt(key.match(/\d+/)[0]));
                }
            }
        } else {
            todaysScore.score = 10 + 2 * (todaysLetters.length - 5);
            cluesToReveal.push(0);
            todaysScore.clue0Revealed = 1;

            // write new game to database
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
        scoringTitle.textContent = "Scoring";
        scoreBody1.textContent = "Clue 1 :         Free!";
        scoreBody2.textContent = "Clue 2 :         2 points";
        scoreBody3.textContent = "Clue 3 :         3 points";
        scoreBody4.textContent = "Letters :        2 points each";
        scoreBody5.textContent = "Bad Guess:     2 points";
        scoringBody.appendChild(scoreBody1);
        scoringBody.appendChild(scoreBody2);
        scoringBody.appendChild(scoreBody3);
        scoringBody.appendChild(scoreBody4);
        scoringBody.appendChild(scoreBody5);

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
        
        // create buy clue button
        const buyClueBtn = document.createElement("button");
        buyClueBtn.classList = "button";
        buyClueBtn.innerHTML = "Buy Clue";
        buyClueBtn.addEventListener("click", async () => {
            const max = Math.max(...cluesToReveal);
            cluesToReveal.push(max + 1);
            if (max == 0) {
                todaysScore.score -= 2; 
            } else {
                todaysScore.score -= 3;
            }
            revealClues(todaysClues, cluesToReveal, clueElements);
            scoreNumDiv.textContent = todaysScore.score;
            try {
                await updateScores(todaysScore, lettersToReveal, cluesToReveal);
            } catch (err) {
                console.error("Failed to save score:", err);
            }
            btnDisabler(todaysScore, todaysLetters, todaysClues, lettersToReveal, 
                cluesToReveal, buyClueBtn, buyLetterBtn, guessWordBtn)
        });
        btnDivTop.appendChild(buyClueBtn);

        // create buy letter button
        const buyLetterBtn = document.createElement("button");
        buyLetterBtn.classList = "button";
        buyLetterBtn.innerHTML = "Buy Letter";
        buyLetterBtn.addEventListener("click", async () => {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * todaysLetters.length);
            } 
            while (lettersToReveal.includes(randomIndex));
            lettersToReveal.push(randomIndex);
            todaysScore.score -= 2;
            revealLetters(todaysLetters, lettersToReveal);
            scoreNumDiv.textContent = todaysScore.score
            try {
                await updateScores(todaysScore, lettersToReveal, cluesToReveal);
            } catch (err) {
                console.error("Failed to save score:", err);
            }
            btnDisabler(todaysScore, todaysLetters, todaysClues, lettersToReveal, 
                cluesToReveal, buyClueBtn, buyLetterBtn, guessWordBtn)
        });
        btnDivTop.appendChild(buyLetterBtn);
    
        // create guess word button
        const guessWordBtn = document.createElement("button");
        guessWordBtn.classList = "button";
        guessWordBtn.innerHTML = "Guess Word";
        guessWordBtn.addEventListener("click", async () => {
            let wordGuess = "";

            // check for blanks + build word
            for (let i = 0; i < todaysLetters.length; i++) {
                const input = document.querySelector(`[name="entry${i}"]`);

                if (!input || input.value.trim() === "") {
                    alert("Please fill in all letters before guessing.");
                    return;
                }

                wordGuess += input.value.toLowerCase();
            }

            // compare guess
            if (wordGuess !== todaysWord.toLowerCase()) {
                todaysScore.score -= 2;
                alert("Incorrect guess!");
            } else {
                alert("Correct!");
                todaysScore.finalScore = todaysScore.score;

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
            
            revealLetters(todaysLetters, lettersToReveal);
            revealClues(todaysClues, cluesToReveal, clueElements);
            try {
                await updateScores(todaysScore, lettersToReveal, cluesToReveal);
            } catch (err) {
                console.error("Failed to save score:", err);
            }
            btnDisabler(todaysScore, todaysLetters, todaysClues, lettersToReveal, 
                cluesToReveal, buyClueBtn, buyLetterBtn, guessWordBtn)
        });
        btnDivBottom.appendChild(guessWordBtn);
        btnDisabler(todaysScore, todaysLetters, todaysClues, lettersToReveal, 
            cluesToReveal, buyClueBtn, buyLetterBtn, guessWordBtn);
    
        // load standings
        const resStand = await fetch("/api/getStandings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ currentWeek })
        });

        const resultStand = await resStand.json();
        // const rowStand = resultStand;
        console.log(resultStand);
        buildStandingsTable(resultStand);

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
    localStorage.setItem("username", data.user.username);
    localStorage.setItem("playerId", data.user.playerId);
    document.getElementById("loginModal").style.display = "none";
    location.reload();
});