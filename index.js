const express = require("express");
const bodyParser = require("body-parser");
const EventEmitter = require("events");

class CSGOGSI extends EventEmitter {
    constructor(port = 3000) {
        super();
        this._isBombPlanted = false;
        this._c4Interval = null;
        this.app = express();

        this.app.use(bodyParser.json());          // to support JSON-encoded bodies

        this.server = this.app.listen(port, () => {
            let addr = this.server.address();
            console.log(`[@] CSGO GSI server listening on ${addr.address}:${addr.port}`);
        });

        this.app.post("/", (req, res) => {
            if (typeof req.body !== "undefined") {
                this.emit("all", req.body);
                this.process(req.body);
                return res.writeHead(200);
            }

            return res.writeHead(404);
        });
    }

    process(data) {
        if (typeof data.map !== "undefined") {
            this.emit("gameMap", data.map.name);
            this.emit("gamePhase", data.map.phase); //warmup etc
            this.emit("gameRounds", data.map.round);
            this.emit("gameCTscore", data.map.team_ct_score);
            this.emit("gameTscore", data.map.team_t_score);
        }

        if (typeof data.player !== "undefined") {
            this.emit("player", data.player);
        }

        if (typeof data.round !== "undefined") {
            let maxTime = 0;
            this.emit("roundPhase", data.round.phase);
            switch (data.round.phase) {
                case "live":
                    maxTime = 115;
                    break;
                case "freezetime":
                    maxTime = 15;
                    break;
                case "over":
                    if (this._isBombPlanted) {
                        this._isBombPlanted = false;
                        this.stopC4Countdown();
                    }

                    this.emit("roundWinTeam", data.round.win_team);
                    break;
            }

            if (typeof data.round.bomb !== "undefined") {
                // exploded, planted, defused
                this.emit("bombState", data.round.bomb);
                switch (data.round.bomb) {
                    case "planted":
                        if (!this._isBombPlanted) {
                            this._isBombPlanted = true;
                            let timeleft = 40 - (new Date().getTime() / 1000 - data.provider.timestamp);
                            this.emit("bombTimeStart", timeleft);
                            this.startC4Countdown(timeleft);
                        }

                        break;
                    case "defused":
                    case "exploded":
                        this._isBombPlanted = false;
                        this.stopC4Countdown();
                        break;
                }
            }
        }
    }

    stopC4Countdown() {
        if (this._c4Interval !== null) {
            clearInterval(this._c4Interval);
        }
    }

    startC4Countdown(time) {
        this._c4Interval = setInterval(() => {
            time = time - 1;
            if (time <= 0) {
                clearInterval(this._c4Interval);
                return self._isBombPlanted = false;
            }

            this.emit("bombTimeLeft", time);
        }, 1000);
    }
}

module.exports = CSGOGSI;