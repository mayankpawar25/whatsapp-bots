const express = require('express')
const path = require('path')
const router = express.Router()
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs')

const app = express();

const client = new Client({
    authStrategy: new LocalAuth()
});

// router.get('/', (req, res) => {
//     res.render('home');
// })

router.get('/reconnect', (req, res) => {
    const localpath = path.join(__dirname, '.wwebjs_auth')
    try {
        fs.unlinkSync(localpath)
        //file removed
    } catch(err) {
        console.error(err)
    }
    res.render('home');
    console.log('reconnect')
})

module.exports = router