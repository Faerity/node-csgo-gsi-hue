const fs = require("fs");
const { off } = require("process");
const CSGOGSI = require("../index"); // const CSGOGSI = require("node-csgo-gsi");

/*enum states{
    off,
    freezetime,
    live,
    bombActive,
    bombExploded,
    bombDefused,
    ctWin,
    tWin
}
states gameState = off;*/


let gsi = new CSGOGSI({
    port: 3000,
    authToken: ["Q79v5tcxVQ8u", "Team2Token", "Team2SubToken"] // this must match the cfg auth token
});

gsi.on("all", function (data) {
    fs.appendFileSync("./payload.txt", JSON.stringify(data, null, 2));
});

//gsi.on("gameMap", (map) => console.log(`gameMap: ${map}`));
gsi.on("gamePhase", (phase) => console.log(`gamePhase: ${phase}`));
//gsi.on("gameRounds", (rounds) => console.log(`gameRounds: ${rounds}`));
gsi.on("gameCTscore", (team_ct) => console.log(`gameCTscore: ${team_ct}`));
gsi.on("gameTscore", (team_t) => console.log(`gameTscore: ${team_t}`));
//gsi.on("roundWins", (wins) => console.log(`roundWins: ${roundWins}`));
//gsi.on("player", (player) => console.log(`player: ${player}`));
//gsi.on("roundPhase", (phase) => console.log(`roundPhase: ${phase}`));
//gsi.on("roundWinTeam", (team) => console.log(`roundWinTeam HUAT AH: ${team}`));
//gsi.on("bombState", (state) => console.log(`bombState: ${state}`));
//gsi.on("bombTimeStart", (time) => console.log(`bombTimeStart: ${time}`));
//gsi.on("bombExploded", () => console.log(`bombExploded`));
//gsi.on("bombTimeLeft", (time) => console.log(`bombTimeLeft: ${time}`));

//gsi.on("phaseCountdowns", (phase_countdowns) => console.log(`gameTscore: ${team_t}`));

//Sending midi signal when bomb is planted
var bombPlanted = false;
gsi.on("bombState", function(state){
    if(state=="planted" && !bombPlanted){
        bombPlanted = true;
        console.log("Midi signal: bomb planted");
    }
});

//Sending midi signal when round is over
//Problem: when a new game is starting: roundphase: over, over, freezetime, live 
//Rather: check which team wins: T, CT, if no teams won yet: undefined
//roundWinTeam seems to be staying the winner team, it will not go back to undefined 
var roundOver = false;
gsi.on("roundWinTeam", function(team){
    if((team=="T" || team=="CT") && !roundOver){
        bombPlanted = false;
        roundOver = true; 
        console.log("Midi signal: round over, reset lightning");
    }
    else if(typeof team == 'undefined'){
        roundOver = false;
    }
}); 

//round start