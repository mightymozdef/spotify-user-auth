const express = require("express");
const axios = require("axios").default;
const qs = require("qs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require('dotenv').config();
const app = express();
const port = 4000;

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
    clientId: spotify_client_id,
    clientSecret: spotify_client_secret,
    redirectUri: redirect_uri
});

const scopes = [
    'ugc-image-upload',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    'user-read-email',
    'user-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-read-private',
    'playlist-modify-private',
    'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    'user-follow-read',
    'user-follow-modify'
];

var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

var stateKey = 'spotify_auth_state';

app.get("/", (req, res) => {
    console.log(res);
})

// app.get("/login", (req, res) => {

//     var state = generateRandomString(16);
//     res.cookie(stateKey, state);

//     res.redirect('https://accounts.spotify.com/authorize?' +
//         new URLSearchParams({
//             response_type: 'code',
//             client_id: spotify_client_id,
//             scope: 'user-read-private user-read-email',
//             redirect_uri: redirect_uri,
//             state: state
//         }).toString()
//     );
// });

// app.get("/callback", (req, res) => {

//     var code = req.query.code || null;

//     axios({
//         method: 'post',
//         url: 'https://accounts.spotify.com/api/token',
//         data: qs.stringify({
//             grant_type: 'authorization_code',
//             code: code,
//             redirect_uri: redirect_uri
//         }),
//         headers: {
//             'content-type': 'application/x-www-form-urlencoded',
//             Authorization: `Basic ${new Buffer.from(`${spotify_client_id}:${spotify_client_secret}`).toString('base64')}`,
//         },
//     }).then(response => {
//         if (response.status === 200) {
//             res.send(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`)
//         } else {
//             res.send(response);
//         }
//     }).catch(error => {
//         res.send(error);
//     });

// })

// app.get('/playlists', (req, res) => {

//     var code = req.query.code || null;

//     axios({
//         method: 'get',
//         url: 'https://api.spotify.com/v1/me/playlists',
//         data: qs.stringify({
//             grant_type: 'authorization_code',
//             code: code,
//             redirect_uri: redirect_uri
//         }),
//     }).then(response => console.log(response)).catch(error => { console.log(error); });
// })

app.get('/login', (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes))
})

app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;

    if (error) {
        console.error(`Callback error:`, error);
        res.send(`Callback error: ${error}`);
        return;
    }

    spotifyApi
        .authorizationCodeGrant(code)
        .then(data => {
            const access_token = data.body['access_token'];
            const refresh_token = data.body['refresh_token'];
            const expires_in = data.body['expires_in'];

            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            console.log('access_token ' + access_token)
            console.log('refresh_token ' + refresh_token);

            // res.send('Success! You can now close the window.');

            return spotifyApi.getPlaylistTracks('1l1jxY61XqOxj8TVDnHRg4', { limit: 5 })

            setInterval(async () => {
                const data = await spotifyApi.refreshAccessToken();
                const access_token = data.body['access_token'];

                spotifyApi.setAccessToken(access_token);
            }, expires_in / 2 * 1000);
        })
        .then(data => {
            console.log(data)

            let items = data.body['items'];

            console.log(JSON.stringify(items))
        })
        .catch(error => {
            console.error('error getting tokens: ' + error);
            res.send(`Error getting tokens ${error}`);
        });
})

// app.get('/playlists', (req, res) => {
//     const error = req.query.error;
//     const code = req.query.code;
//     const state = req.query.state;

//     if (error) {
//         console.error(`Callback error:`, error);
//         res.send(`Callback error: ${error}`);
//         return;
//     }

//     spotifyApi.authorizationCodeGrant(code).then(data => {
//         const access_token = data.body['access_token'];
//         const refresh_token = data.body['refresh_token'];
//         const expires_in = data.body['expires_in'];

//         spotifyApi.setAccessToken(access_token);

//         return spotifyApi.getMe();
//     }).then(data => {
//         console.log(data)
//     })
// })

app.listen(port, () => {
    console.log(`express app listening on port ${port}`);
})