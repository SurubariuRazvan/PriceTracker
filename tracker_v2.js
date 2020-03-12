let SteamUser = require("steam-user"),
    https = require('https'),
    SteamTotp = require("steam-totp"),
    SteamCommunity = require("steamcommunity"),
    fs = require("fs"),
    chatLogs = "",
    userLogs = {};

let client = new SteamUser(),
    community = new SteamCommunity(),
    games = JSON.parse(fs.readFileSync('games_v2.json'));
var time = 0,
    alive_message_interval_in_minutes_variable = parseInt((60 / ((games.keys.length + 1) * games.seconds_between_key_checks + (games.gamesbuy.length + games.gamesbuy.length) * games.seconds_between_game_checks)) * ((games.keys.length + 1) + games.gamesbuy.length + games.gamesbuy.length) * games.alive_message_interval_in_minutes),
    scheduling_order = 0;

scheduling_checks();

function scheduling_checks() {
    if (games.seconds_between_key_checks !== 0)
        scheduling_keys();
    if (games.seconds_between_game_checks !== 0)
        scheduling_games();
}

function scheduling_keys() {
    if (games.seconds_between_key_checks !== 0) {
        for (i = 0; i < games.keys.length; i++)
            setTimeout(scheduling, 1000 * (games.seconds_between_key_checks * i + scheduling_order * games.seconds_between_game_checks), games.keys[i]);
        scheduling_order = i + 1;
    }
}

function scheduling_games(i) {
    for (i = 0; i < games.gamesbuy.length; i++)
        setTimeout(scheduling, 1000 * (games.seconds_between_game_checks * i + scheduling_order * games.seconds_between_key_checks), games.gamesbuy[i]);
    scheduling_order = i + 1;
    for (i = 0; i < games.gamessell.length; i++)
        setTimeout(scheduling, 1000 * (games.seconds_between_game_checks * i + scheduling_order * games.seconds_between_key_checks), games.gamessell[i]);
    scheduling_order = i + 1;
}

function scheduling(game_temp) {
    checkPrice(game_temp);
    setInterval(checkPrice, 1000 * ((games.keys.length + 1) * games.seconds_between_key_checks + (games.gamessell.length + games.gamesbuy.length) * games.seconds_between_game_checks), game_temp);
}

function notify(text) {
    for (let i = 0; i < games.to_notify.length; i++)
        client.chatMessage(games.to_notify[i], text);
}

function checkPrice(game) {
    let n;
    if (game.links.indexOf("category") >= 0)
        n = "https://www.kinguin.net/" + game.links;
    else if (game.links !== "xxxxxxxxxxxxxxxxx")
        n = "https://www.g2a.com/marketplace/product/auctions/?id=" + game.gameid;
    if (game.links !== "xxxxxxxxxxxxxxxxx")
        if (game.links.indexOf("category") < 0)
            req = https.get(n, (res) => {
                var timer = setTimeout(req.abort, 1000 * 10);
                let rawData = '';
                res.on('data', (chunk) => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    let j, price = '', type = '', ratings = '', rating_procent = '', seller_name = '';
                    if (games.alive_message_interval_in_minutes !== 0) {
                        time++;
                        if (time === alive_message_interval_in_minutes_variable) {
                            console.log(new Date().toLocaleString(), `: still alive`);
                            time = 0;
                        }
                    }
                    j = rawData.indexOf('"ep"') + 6;
                    if (j !== 5) {
                        let temp;
                        while (rawData[j] !== '"')
                            price += rawData[j++];
                        if (game.price === undefined)
                            temp = games.keysprice;
                        else
                            temp = game.price;
                        if (games.show_details === true)
                            console.log(new Date().toLocaleString(), ":", game.name, ":", parseFloat(price), "€", " : ", temp);
                        if (game.sell !== true) {
                            if (parseFloat(price) <= temp) {
                                j = rawData.indexOf('"cname"') + 9;
                                while (rawData[j] !== '"')
                                    seller_name += rawData[j++];
                                j = rawData.indexOf('"tr"', j) + 5;
                                while (rawData[j] !== ',')
                                    ratings += rawData[j++];
                                j = rawData.indexOf('"r"', j) + 4;
                                while (rawData[j] !== ',')
                                    rating_procent += rawData[j++];
                                if ((price <= temp / 2 || (parseInt(ratings) > 50 && parseInt(rating_procent) >= 95) || (parseInt(ratings) >= 10 && parseInt(rating_procent) >= 98))) {
                                    console.log(new Date().toLocaleString() + ` : ${game.name} is sold as a ${type} by "${seller_name}"(Ratings:${parseInt(ratings)}, ${parseInt(rating_procent)}%) for ${parseFloat(price).toFixed(2)}€, your wanted price is ${temp.toFixed(2)}€`);
                                    notify(new Date().toLocaleString() + ` : ${game.name} is sold as a ${type} by "${seller_name}"(Ratings:${parseInt(ratings)}, ${parseInt(rating_procent)}%) for ${parseFloat(price).toFixed(2)}€, your wanted price is ${temp.toFixed(2)}€`);
                                    fs.appendFile('log_v2.txt', new Date().toLocaleString() + ` : ${game.name} is sold as a ${type} by "${seller_name}"(Ratings:${parseInt(ratings)}, ${parseInt(rating_procent)}%) for ${parseFloat(price).toFixed(2)}€, your wanted price is ${temp.toFixed(2)}€\r\n`);
                                    beep(3);
                                }
                            }
                        } else if (parseFloat(price) >= temp) {
                            console.log(new Date().toLocaleString() + ` : ${game.name} can be sold for ${parseFloat(price).toFixed(2)}€`);
                            notify(new Date().toLocaleString() + ` : ${game.name} can be sold for ${parseFloat(price).toFixed(2)}€`);
                            fs.appendFile('log_v2.txt', new Date().toLocaleString() + ` : ${game.name} can be sold for ${parseFloat(price).toFixed(2)}€`);
                            beep(3);
                        }
                    }
                    clearTimeout(timer);
                });
            }).on('error', (e) => {
                console.error(`Got error: ${e.message}`);
            });
        else
            req = https.get(n, (res) => {
                var timer = setTimeout(req.abort, 1000 * 10);
                let rawData = '';
                res.on('data', (chunk) => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    let j, price = '';
                    if (games.alive_message_interval_in_minutes !== 0) {
                        time++;
                        if (time === alive_message_interval_in_minutes_variable) {
                            console.log(new Date().toLocaleString(), `: still alive`);
                            time = 0;
                        }
                    }
                    j = rawData.indexOf("offers from") + 13;
                    if (j !== 12) {
                        while (rawData[j] !== '"')
                            price += rawData[j++];
                        if (games.show_details === true)
                            console.log(new Date().toLocaleString(), ":", game.name, ":", parseFloat(price));
                        if (game.sell !== true) {
                            if (parseFloat(price) <= game.price) {
                                console.log(new Date().toLocaleString() + ` : ${game.name} is sold for E${parseFloat(price).toFixed(2)}, your wanted price is E${game.price.toFixed(2)}`);
                                fs.appendFile('log_v2.txt', new Date().toLocaleString() + ` : ${game.name} is sold for E${parseFloat(price).toFixed(2)}, your wanted price is E${game.price.toFixed(2)}\r\n`);
                                beep(3);
                            }
                        } else if (parseFloat(price) >= game.price) {
                            console.log(new Date().toLocaleString() + ` : ${game.name} can be sold for E${parseFloat(price).toFixed(2)}`);
                            fs.appendFile('log_v2.txt', new Date().toLocaleString() + ` : ${game.name} can be sold for E${parseFloat(price).toFixed(2)}`);
                            beep(3);
                        }
                    } else
                        console.log(new Date().toLocaleString() + ` : shit`);
                    clearTimeout(timer);
                });
            }).on('error', (e) => {
                console.error(`Got error: ${e.message}`);
            });
}

//allert fuction
function beep(t) {
    if (games.audio_notification === true) {
        process.stdout.write("\x07");
        t--;
        if (t > 0)
            beep(t);
    }
}

function addnewgame(destination, links, price, index, sell) {
    let n;
    if (links.indexOf("category") >= 0)
        n = "https://www.kinguin.net/" + links;
    else
        n = "https://www.g2a.com/" + links;
    req = https.get(`${n}`, (res) => {
        var timer = setTimeout(req.abort, 1000 * 10);
        let rawData = '';
        res.on('data', (chunk) => {
            rawData += chunk;
        });
        res.on('end', () => {
            var name = "", gameid = "";
            if (n.indexOf("g2a") >= 0) {
                let j = rawData.indexOf("</script><title>") + 16;
                while (rawData[j] !== " " || rawData[j + 1] !== "-")
                    name += rawData[j++];
                j = rawData.indexOf("productID", j) + 12;
                while (rawData[j] !== ";")
                    gameid += rawData[j++];
            } else if (links.indexOf("kinguin") >= 0) {
                let j = rawData.indexOf("<title>") + 7;
                while (rawData[j] !== " " || rawData[j + 1] !== "|")
                    name += rawData[j++];
            }
            if (sell === true)
                destination.splice(index, 0, {
                    "links": `${links}`,
                    "price": price,
                    "name": `${name}`,
                    "gameid": `${gameid}`,
                    "sell": true
                });
            else
                destination.splice(index, 0, {
                    "links": `${links}`,
                    "price": price,
                    "name": `${name}`,
                    "gameid": `${gameid}`,
                    "sell": false
                });
            fs.writeFile("games.json", JSON.stringify(games, null, 4));
            clearTimeout(timer);
        });
    }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
    });
}

client.logOn({
    accountName: "acc",
    password: "pass",
    twoFactorCode: SteamTotp.getAuthCode("randomString=")
});

client.on("loggedOn", (details, parental) => {
    client.getPersonas([client.steamID], (personas) => {
        console.log(new Date().toLocaleString() + "## Logged in as #" + client.steamID + " (" + personas[client.steamID].player_name + ")");
    });
    client.setPersona(1);
    //client.gamesPlayed(CONFIG.PLAYGAMES);
});

community.on("sessionExpired", (ERR) => {
    console.log("## Session Expired. Relogging.");
    client.webLogOn();
});

client.on("friendMessage", (SENDER, MSG) => {
    if (userLogs[SENDER.getSteamID64()]) {
        userLogs[SENDER.getSteamID64()].push(MSG);
    } else {
        userLogs[SENDER.getSteamID64()] = [];
        userLogs[SENDER.getSteamID64()].push(MSG);
    }
    fs.writeFile("" + SENDER.getSteamID64() + "-log-" + new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear() + ".json", JSON.stringify({logs: userLogs[SENDER.getSteamID64()]}), (ERR) => {
        if (ERR) {
            console.log("## An error occurred while writing UserLogs file: " + ERR);
        }
    });
    console.log(SENDER, " : ", MSG);
    if (MSG.toUpperCase().indexOf("!HELP") >= 0) {
        client.chatMessage(SENDER, "To add games to check for less than price use the !addbuy [link] [price] command.\nTo change a price check for a game use !changebuy [link] [price] or !changesell [link] [price].\nTo remove a price ceck use !removebuy [link] [price] or !removesell [link] [price]. \nRemove https://www. kinguin. net/ or https://www. g2a. com/ from links before you send the message because steam will delete the link if you dont and you will get an error message.\nTo see all checked games use !showgames.\nAfter you add or remove games a restart is needed.");
    } else if (MSG.toUpperCase().indexOf("!ADDBUY") >= 0) {
        let n = MSG.toUpperCase().replace("!ADDBUY ", "");
        if (n !== "!ADDBUY") {
            if (n.indexOf("{LINK REMOVED}") < 0) {
                let gamelink = "", i = -1;
                while (n[++i] !== " ")
                    gamelink = gamelink + n[i];
                n = n.replace(gamelink + " ", "");
                gamelink = gamelink.toLowerCase();
                let gameprice = parseInt(n);
                if (gameprice !== 0 && gameprice != null) {
                    for (i = 0; i < games.gamesbuy.length; i++)
                        if (games.gamesbuy[i].links === gamelink) {
                            client.chatMessage(SENDER, `Game is already in the list for ${games.gamesbuy[i].price}€.`);
                            break;
                        } else if (games.gamesbuy[i].links > gamelink) {
                            addnewgame(games.gamesbuy, gamelink, gameprice, i, false);
                            client.chatMessage(SENDER, `Game was added to the list for ${gameprice}€.`);
                            break;
                        }
                } else {
                    client.chatMessage(SENDER, "Provide a price for the game");
                }
            } else {
                client.chatMessage(SENDER, "Remove https://www. kinguin. net/ or https://www. g2a. com/ from links before you send the message because steam will delete the link if you dont and you will get an error message.");
            }
        } else {
            client.chatMessage(SENDER, `Add a link and a price.`);
        }
    } else if (MSG.toUpperCase().indexOf("!ADDSELL") >= 0) {
        let n = MSG.toUpperCase().replace("!ADDSELL ", "");
        if (n !== "!ADDSELL") {
            if (n.indexOf("{LINK REMOVED}") < 0) {
                let gamelink = "", i = -1;
                while (n[++i] !== " ")
                    gamelink = gamelink + n[i];
                n = n.replace(gamelink + " ", "");
                gamelink = gamelink.toLowerCase();
                let gameprice = parseInt(n);
                if (gameprice !== 0 && gameprice != null) {
                    for (i = 0; i < games.gamessell.length; i++)
                        if (games.gamessell[i].links === gamelink) {
                            client.chatMessage(SENDER, `Game is already in the list for ${games.gamesbuy[i].price}€.`);
                            break;
                        } else if (games.gamessell[i].links > gamelink) {
                            addnewgame(games.gamessell, gamelink, gameprice, i, true);
                            client.chatMessage(SENDER, `Game was added to the list for ${gameprice}€.`);
                            break;
                        }
                } else {
                    client.chatMessage(SENDER, "Provide a price for the game");
                }
            } else {
                client.chatMessage(SENDER, "Remove https://www. kinguin. net/ or https://www. g2a. com/ from links before you send the message because steam will delete the link if you dont and you will get an error message.");
            }
        } else {
            client.chatMessage(SENDER, `Add a link and a price.`);
        }
    } else if (MSG.toUpperCase().indexOf("!CHANGEBUY") >= 0) {
        let n = MSG.toUpperCase().replace("!CHANGEBUY ", "");
        if (n !== "!CHANGEBUY") {
            if (n.indexOf("{LINK REMOVED}") < 0) {
                let gamelink = "", i = -1, ok = 0;
                while (n[++i] !== " ")
                    gamelink = gamelink + n[i];
                n = n.replace(gamelink + " ", "");
                gamelink = gamelink.toLowerCase();
                let gameprice = parseInt(n);
                if (gameprice !== 0 && gameprice != null) {
                    for (i = 0; i < games.gamesbuy.length; i++)
                        if (games.gamesbuy[i].links === gamelink) {
                            client.chatMessage(SENDER, `Price was changed from ${games.gamesbuy[i].price}€ to ${gameprice}€.`);
                            games.gamesbuy[i].price = gameprice;
                            fs.writeFile("games.json", JSON.stringify(games, null, 4));
                            ok = 1;
                            break;
                        }
                    if (ok === 0)
                        client.chatMessage(SENDER, "Can't change price because the game isn't in the list.");
                } else {
                    client.chatMessage(SENDER, "Provide a price for the game");
                }
            } else {
                client.chatMessage(SENDER, "Remove https://www. kinguin. net/ or https://www. g2a. com/ from links before you send the message because steam will delete the link if you dont and you will get an error message.");
            }
        } else {
            client.chatMessage(SENDER, `Add a link and a price.`);
        }
    } else if (MSG.toUpperCase().indexOf("!CHANGESELL") >= 0) {
        let n = MSG.toUpperCase().replace("!CHANGESELL ", "");
        if (n !== "!CHANGESELL") {
            if (n.indexOf("{LINK REMOVED}") < 0) {
                let gamelink = "", i = -1, ok = 0;
                while (n[++i] !== " ")
                    gamelink = gamelink + n[i];
                n = n.replace(gamelink + " ", "");
                gamelink = gamelink.toLowerCase();
                let gameprice = parseInt(n);
                if (gameprice !== 0 && gameprice != null) {
                    for (i = 0; i < games.gamessell.length; i++)
                        if (games.gamessell[i].links === gamelink) {
                            client.chatMessage(SENDER, `Price was changed from ${games.gamesbuy[i].price}€ to ${gameprice}€.`);
                            games.gamessell[i].price = gameprice;
                            fs.writeFile("games.json", JSON.stringify(games, null, 4));
                            ok = 1;
                            break;
                        }
                    if (ok === 0)
                        client.chatMessage(SENDER, "Can't change price because the game isn't in the list.");
                } else {
                    client.chatMessage(SENDER, "Provide a price for the game");
                }
            } else {
                client.chatMessage(SENDER, "Remove https://www. kinguin. net/ or https://www. g2a. com/ from links before you send the message because steam will delete the link if you dont and you will get an error message.");
            }
        } else {
            client.chatMessage(SENDER, `Add a link and a price.`);
        }
    } else if (MSG.toUpperCase().indexOf("!REMOVEBUY") >= 0) {
        let n = MSG.toUpperCase().replace("!REMOVEBUY ", "");
        if (n !== "!REMOVEBUY") {
            if (n.indexOf("{LINK REMOVED}") < 0) {
                let gamelink = n.toLowerCase(), i = -1, ok = 0;
                for (i = 0; i < games.gamesbuy.length; i++)
                    if (games.gamesbuy[i].links === gamelink) {
                        client.chatMessage(SENDER, `Game was removed.`);
                        games.gamesbuy.splice(i, 1);
                        fs.writeFile("games.json", JSON.stringify(games, null, 4));
                        ok = 1;
                        break;
                    }
                if (ok === 0)
                    client.chatMessage(SENDER, "Can't remove the game because the game isn't in the list.");
            } else {
                client.chatMessage(SENDER, "Remove https://www. kinguin. net/ or https://www. g2a. com/ from links before you send the message because steam will delete the link if you dont and you will get an error message.");
            }
        } else {
            client.chatMessage(SENDER, `Add a link.`);
        }
    } else if (MSG.toUpperCase().indexOf("!REMOVESELL") >= 0) {
        let n = MSG.toUpperCase().replace("!REMOVESELL ", "");
        if (n !== "!REMOVESELL") {
            if (n.indexOf("{LINK REMOVED}") < 0) {
                let gamelink = n.toLowerCase(), i = -1, ok = 0;
                for (i = 0; i < games.gamessell.length; i++)
                    if (games.gamessell[i].links === gamelink) {
                        client.chatMessage(SENDER, `Game was removed.`);
                        games.gamessell.splice(i, 1);
                        fs.writeFile("games.json", JSON.stringify(games, null, 4));
                        ok = 1;
                        break;
                    }
                if (ok === 0)
                    client.chatMessage(SENDER, "Can't remove the game because the game isn't in the list.");
            } else {
                client.chatMessage(SENDER, "Remove https://www. kinguin. net/ or https://www. g2a. com/ from links before you send the message because steam will delete the link if you dont and you will get an error message.");
            }
        } else {
            client.chatMessage(SENDER, `Add a link.`);
        }
    } else if (MSG.toUpperCase().indexOf("!SHOWGAMES") >= 0) {
        let message = "------Games to buy:\n", i, j = 0;
        for (i = 0; i < games.gamesbuy.length; i++, j++)
            if (games.gamesbuy[i].links.indexOf("category") >= 0)
                message += `${i + 1}: KINGUIN : ${games.gamesbuy[i].name} for ${games.gamesbuy[i].price}€\n`;
            else if (games.gamesbuy[i].links !== "xxxxxxxxxxxxxxxxx")
                message += `${i + 1}: G2A : ${games.gamesbuy[i].name} for ${games.gamesbuy[i].price}€\n`;
        client.chatMessage(SENDER, message);
        message = "------Games to sell:\n";
        for (i = 0; i < games.gamessell.length; i++, j++)
            if (games.gamessell[i].links.indexOf("category") >= 0)
                message += `${i + 1}: KINGUIN : ${games.gamessell[i].name} for ${games.gamessell[i].price}€\n`;
            else if (games.gamessell[i].links !== "xxxxxxxxxxxxxxxxx")
                message += `${i + 1}: G2A : ${games.gamessell[i].name} for ${games.gamessell[i].price}€\n`;
        client.chatMessage(SENDER, message);
    }
});

/*
client.on("friendRelationship", (SENDER, REL) => {
    if (REL === 2)
        client.addFriend(SENDER);
});
*/