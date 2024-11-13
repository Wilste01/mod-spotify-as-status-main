import { Game } from "@gathertown/gather-game-client";
require('dotenv').config();
global.WebSocket = require("isomorphic-ws");
const Updater = require("spotify-oauth-refresher");

// Lägg till miljövariabler
const API_KEY = process.env.API_KEY!;
const SPACE_ID = process.env.SPACE_ID!;
const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN!;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN!;

// token refresher setup
const api = new Updater({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET });
api.setAccessToken(ACCESS_TOKEN);
api.setRefreshToken(REFRESH_TOKEN);

// gather game client setup
const game = new Game(SPACE_ID, () => Promise.resolve({ apiKey: API_KEY }));
game.connect();
game.subscribeToConnection((connected) => console.log("connected?", connected));

// check every 5s
setInterval(async () => {
  const res = await api.request({
    url: "https://api.spotify.com/v1/me/player/currently-playing",
    method: "get",
    authType: "bearer",
  });

  let playing = "";
  let emoji = "";

  if (res.data.is_playing === true) {
    if (res.data.currently_playing_type === "track") {
      playing =
        res.data.item.name + " ∙ " + res.data.item.artists[0].name + " (Spotify)";
      emoji = "🎶";
    } else if (res.data.currently_playing_type === "episode") {
      playing = "listening to some podcast (Spotify)";
      emoji = "🎧";
    }
    else console.log("unexpected value in 'currently_playing_type'")
  }
  else { // listening to nothing
    playing = "";
    emoji = "";
  }; 

  if (playing !== "") {
    console.log(playing);
  }
  else console.log("stopped listening");

  game.sendAction({
    $case: "setEmojiStatus",
    setEmojiStatus: {
      emojiStatus: emoji,
    },
  });
  game.sendAction({
    $case: "setTextStatus",
    setTextStatus: {
      textStatus: playing,
    },
  });
}, 5000);
