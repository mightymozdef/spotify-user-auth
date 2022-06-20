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

app.get("/login", (req, res) => {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    res.redirect('https://accounts.spotify.com/authorize?' +
        new URLSearchParams({
            response_type: 'code',
            client_id: spotify_client_id,
            scope: 'user-read-private user-read-email',
            redirect_uri: redirect_uri,
            state: state
        }).toString()
    );
});

app.get("/callback", (req, res) => {

    var code = req.query.code || null;

    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: qs.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri
        }),
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${new Buffer.from(`${spotify_client_id}:${spotify_client_secret}`).toString('base64')}`,
        },
    }).then(response => {
        if (response.status === 200) {
            res.send(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`)
        } else {
            res.send(response);
        }
    }).catch(error => {
        res.send(error);
    });

})

app.listen(port, () => {
    console.log(`express app listening on port ${port}`);
})