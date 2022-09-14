const { Client, LocalAuth, MessageMedia, List, Buttons } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode')
const express = require('express');
const moment = require('moment');
const path = require('path')
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');

const modal = require("./modal.js");

const app = express();
const port = 3000;


app.engine('handlebars', exphbs.engine({ extname: '.handlebars', defaultLayout: "main" }));
app.set('view engine', 'handlebars');

app.use(express.static(path.join(__dirname, "static")))
app.use(express.static('./images'));
app.use('/', require(path.join(__dirname, 'routes/index.js')))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true }, function (qrcode) {
        QRCode.toDataURL(qr, function (err, url) {
            console.log(url + '\n')
            app.get('/', (req, res) => {
                res.render('home', {
                    qrcode: url
                })
            })
        })
    })
});

client.on('ready', () => {

    console.log('Client is ready1!');
    app.get('/', (req, res) => {
        res.render('connected')
    })

    app.post('/welcometemplate', async (req, res) => {
        try {
            const number = req.body.mobile;
            const name = req.body.name;
            const sanitized_number = number.toString().replace(/[- )(]/g, ""); // remove unnecessary chars from the number
            const final_number = `91${sanitized_number.substring(sanitized_number.length - 10)}`; // add 91 before the number here 91 is country code of India
            const message = `Hello ${name} 🙋🏻‍♀️,\n\nThank you so much for showing interest in us.\n\nTutorWand is India’s first and best free web based tool, enabling teachers to generate tests in 60 seconds, enjoy AI backed auto-grading, and create insightful student reports- for classes 6th to 12th.\n\nTo know more please visit www.tutorwand.com. You need not download the app 🙂\n\nYou can also watch our demo video here https://www.youtube.com/watch?v=cYcaOPQWhlM.\n\nWe value teaching and you,`;
            const media = await MessageMedia.fromFilePath('./images/welcomeImage.jpeg')
            await client.sendMessage(`${final_number}@c.us`, media, { caption: message }); // Send the message

            return res.send(`${name} message sent to ${number}`);
        } catch (error) {
            return res.send(`Error sent message`);
        }
    })

    app.post('/sendcustommessage', async (req, res) => {
        try {
            const number = req.body.mobile;
            const name = req.body.name;
            const message = req.body.message;
            const sanitized_number = number.toString().replace(/[- )(]/g, ""); // remove unnecessary chars from the number
            const final_number = `91${sanitized_number.substring(sanitized_number.length - 10)}`; // add 91 before the number here 91 is country code of India
            // const media = await MessageMedia.fromFilePath('./images/welcomeImage.jpeg')
            await client.sendMessage(`${final_number}@c.us`, message); // Send the message

            return res.send(`${message} sent to ${number}`);
        } catch (error) {
            return res.send(`Error sent message`);
        }
    })

    app.get('/welcome/:number/:name', async (req, res, next) => {
        try {
            const number = req.params.number;
            const name = req.params.name;
            const sanitized_number = number.toString().replace(/[- )(]/g, ""); // remove unnecessary chars from the number
            const final_number = `91${sanitized_number.substring(sanitized_number.length - 10)}`; // add 91 before the number here 91 is country code of India
            const message = `Hello ${name} 🙋🏻‍♀️,\n\nThank you so much for showing interest in us.\n\nTutorWand is India’s first and best free web based tool, enabling teachers to generate tests in 60 seconds, enjoy AI backed auto-grading, and create insightful student reports- for classes 6th to 12th.\n\nTo know more please visit www.tutorwand.com. You need not download the app 🙂\n\nYou can also watch our demo video here https://www.youtube.com/watch?v=cYcaOPQWhlM.\n\nWe value teaching and you,`;
            var media = await MessageMedia.fromFilePath('./images/welcomeImage.jpeg')
            const msg = await client.sendMessage(`${final_number}@c.us`, media, { caption: message }); // Send the message

            res.render('sendmessage', {
                number: number
            })
        } catch (error) {
            throw new Error(err.message);
        }
    });

    app.get('/sendmessage/:number/:message', async (req, res, next) => {
        try {
            const number = req.params.number;
            const message = req.params.message;
            const sanitized_number = number.toString().replace(/[- )(]/g, ""); // remove unnecessary chars from the number
            const final_number = `91${sanitized_number.substring(sanitized_number.length - 10)}`; // add 91 before the number here 91 is country code of India
            const msg = await client.sendMessage(`${final_number}@c.us`, message); // Send the message

            res.render('sendmessage', {
                number: number
            })
        } catch (error) {
            throw new Error(err.message);
        }
    });

    client.on('message', async (message) => {
        try {
            const chat = await message.getChat();
            const contact = await message.getContact();
            const from = await message.from;
            const to = await message.to;

            const pushName = contact.pushname;
            const number = contact.number;
            let status = '';
            let userMessage = [];
            let isValidText = true;
            let isProducts = false;
            let medias = [];
            let replyMessage = '';

            // MySQL select query
            modal.selectData('whatsapp_user', '*', `number LIKE "${number}"`, async (result) => {
                let user_id = '';
                if (result == undefined) {
                    if (message.body.toLowerCase() === 'hello' || message.body.toLowerCase() === 'hi') {
                        // insert
                        insertStatus = modal.insertData('whatsapp_user', 'name, number,	status, messages', `'${pushName}', '${number}', '${status}', '${JSON.stringify(userMessage)}'`)
                        if (insertStatus) { console.log('1 record inserted') }
                        replyMessage = modal.replyMessage(message.deviceType, 'welcome');
                        status = 'main';
                    }
                } else {
                    userMessage.push(...JSON.parse(result['messages']))
                    user_id = result['id']
                    orderTime = moment().format("DD-MM-YYYY HH:mm:ss");

                    if (result['status'] == '') {
                        if (message.body.toLowerCase() === 'hello' || message.body.toLowerCase() === 'hi') {
                            replyMessage = modal.replyMessage(message.deviceType, 'welcome');
                            status = 'main'
                        } else {
                            // Auto Reply
                            replyMessage = "Hi, thanks for contacting *TutorWand*. Please leave your message here our team will get back to you"
                            status = 'Auto Reply'
                        }
                    } else if (result['status'] == 'main') {
                        let options = parseInt(message.body)

                        if (Number.isInteger(options) || message.type === 'list_response') {
                            status = 'main'
                            console.log(message.body, modal.messageSearch(message.body, 1, 'welcome'));

                            if (options == 0 || modal.messageSearch(message.body, 0, 'welcome')) {
                                replyMessage = "Thanks for contacting *Tutorwand*. Have a great Day 🙂"
                                status = ''
                            } else if (options == 1 || modal.messageSearch(message.body, 1, 'welcome')) {
                                replyMessage = modal.replyMessage(message.deviceType, 'contact');
                            } else if (options == 2 || modal.messageSearch(message.body, 2, 'welcome')) {
                                replyMessage = "You have entered *ordering mode*. Select any of the Category."
                                message.reply(replyMessage);
                                status = 'category'
                                replyMessage = modal.replyMessage(message.deviceType, 'category');

                            } else if (options == 3 || modal.messageSearch(message.body, 3, 'welcome')) {
                                replyMessage = "We work from *10 AM to 06 PM*."

                            } else if (options == 4 || modal.messageSearch(message.body, 4, 'welcome')) {
                                replyMessage = "We have multiple stores across the city. Our main center is at *127 Gopur Colony, Annapurna Road, Indore-452008*"

                            } else if (options == 5 || modal.messageSearch(message.body, 5, 'welcome')) {
                                replyMessage = "Would you please provide your feedback?"
                                status = 'feedback'
                            } else {
                                replyMessage = 'Please enter a valid response'
                                isValidText = false;
                            }
                        } else {
                            status = 'main'
                            replyMessage = 'Please enter a valid response'
                            isValidText = false;
                        }
                    } else if (result['status'] == 'category') {
                        let options = parseInt(message.body)
                        if (Number.isInteger(options)) {
                            status = 'order';

                            if (options == 0 || modal.messageSearch(message.body, 0, 'category')) {
                                isProducts = false

                                status = 'main'
                                replyMessage = modal.replyMessage(message.deviceType, 'welcome');
                            } else if (options == 1 || modal.messageSearch(message.body, 1, 'category')) {
                                isProducts = true
                                replyMessage = "You can select one of the following *Swaddle* to order:"
                                medias.push(
                                    {
                                        media: await MessageMedia.fromUrl(`https://consciouslabel.in/image/cache/catalog/Swaddle/sdb-400x400.jpg`),
                                        text: ` 1️⃣ SWADDLE - 101 Dalmations - Blueberry Cream *₹1,400.00/-*`
                                    },
                                    {
                                        media: await MessageMedia.fromUrl(`https://consciouslabel.in/image/cache/catalog/Swaddle/sdboo-1-400x400.jpg`),
                                        text: `2️⃣ SWADDLE - 101 Dalmations - Butternut Squash *₹1,400.00/-*`
                                    },
                                    {
                                        media: await MessageMedia.fromUrl(`https://consciouslabel.in/image/cache/catalog/Swaddle/sdyy-400x400.jpg`),
                                        text: `3️⃣ SWADDLE - 101 Dalmations - Lime And Lemonade *₹1,400.00/-*`
                                    },
                                    {
                                        media: '',
                                        text: `0️⃣ Go Back`
                                    }
                                );

                            } else if (options == 2 || modal.messageSearch(message.body, 2, 'category')) {
                                isProducts = true
                                replyMessage = "You can select one of the following *Burp Clothes* to order:"
                                medias.push(
                                    {
                                        media: await MessageMedia.fromUrl(`https://consciouslabel.in/image/cache/catalog/Burp%20Cloth/mg-1-400x400.jpg`),
                                        text: ` 1️⃣ BRUP CLOTH - Moon And The Starry Night - Whipped Seafoam *₹436.80/-*`
                                    },
                                    {
                                        media: await MessageMedia.fromUrl(`https://consciouslabel.in/image/cache/catalog/Burp%20Cloth/db-01-400x400.jpg`),
                                        text: `2️⃣ BURP CLOTH - 101 Dalmations - Blueberry Cream *₹436.80/-*`
                                    },
                                    {
                                        media: await MessageMedia.fromUrl(`https://consciouslabel.in/image/cache/catalog/Burp%20Cloth/do-01-400x400.jpg`),
                                        text: `3️⃣ BURP CLOTH - 101 Dalmations - Butternut Squash *₹436.80/-*`
                                    },
                                    {
                                        media: '',
                                        text: `0️⃣ Go Back`
                                    }
                                );
                            } else if (options == 3 || modal.messageSearch(message.body, 3, 'category')) {
                                isProducts = true
                                replyMessage = "You can select one of the following *Nursing Pillow* to order:"
                                medias.push(
                                    {
                                        media: await MessageMedia.fromUrl(`https://consciouslabel.in/image/cache/catalog/Nursing%20Pillow/np-green01-400x400.jpg`),
                                        text: ` 1️⃣ NURSING PILLOW - 101 Dalmations - Whipper Seafoam *₹3,348.80/-*`
                                    },
                                    {
                                        media: await MessageMedia.fromUrl(`https://consciouslabel.in/image/cache/catalog/Nursing%20Pillow/np-blue01-400x400.jpg`),
                                        text: `2️⃣ NURSING PILLOW - 101 Dalmations - Blueberry Cream *₹3,348.80/-*`
                                    },
                                    {
                                        media: await MessageMedia.fromUrl(`https://consciouslabel.in/image/cache/catalog/Nursing%20Pillow/npmo-0-400x400.jpg`),
                                        text: `3️⃣ NURSING PILLOW - 101 Dalmations - Butternut Squash *₹3,348.80/-*`
                                    },
                                    {
                                        media: '',
                                        text: `0️⃣ Go Back`
                                    }
                                );

                            } else if (options == 4 || modal.messageSearch(message.body, 4, 'category')) {
                                isProducts = true
                                replyMessage = "You can select one of the following *Snuggle Pillow* to order:"
                                medias.push(
                                    {
                                        media: await MessageMedia.fromUrl(`https://consciouslabel.in/image/cache/catalog/SNUGGLE%20PILLOW/sbdb-1-400x400.jpg`),
                                        text: ` 1️⃣ SNUGGLE PILLOW - 101 Dalmations - Blueberry Cream *₹2,520.00/-*`
                                    },
                                    {
                                        media: await MessageMedia.fromUrl(`https://consciouslabel.in/image/cache/catalog/SNUGGLE%20PILLOW/sbdy-1-400x400.jpg`),
                                        text: `2️⃣ SNUGGLE PILLOW - 101 Dalmations - Lime And Lemonade *₹2,520.00/-*`
                                    },
                                    {
                                        media: await MessageMedia.fromUrl(`https://consciouslabel.in/image/cache/catalog/SNUGGLE%20PILLOW/sbdg-1-400x400.jpg`),
                                        text: `3️⃣ SNUGGLE PILLOW - 101 Dalmations - Whipped Seafoam *₹2,520.00/-*`
                                    },
                                    {
                                        media: '',
                                        text: `0️⃣ Go Back`
                                    }
                                );
                            } else {
                                isProducts = false
                                status = 'category'
                                replyMessage = 'Please enter a valid response'
                            }
                        } else {
                            status = 'order'
                            replyMessage = 'Please enter a valid response'
                            isValidText = false;
                        }
                    } else if (result['status'] == 'order') {
                        let options = parseInt(message.body)
                        if (Number.isInteger(options)) {
                            status = 'quantity'
                            if (options == 0) {
                                status = 'category'
                                replyMessage = modal.replyMessage(message.deviceType, options, 'category');
                            } else if (options <= 3) {
                                modal.selectData('whatsapp_user', 'choice_category', `number LIKE "${number}"`, async (choiceResult) => {
                                    let products = JSON.parse(choiceResult['choice_category'])
                                    chat.sendMessage(`Excellent choice 😉 \nYou choosed ${products[options - 1]} \n*Please select quantity between 1️⃣ to 5️⃣*`)
                                    console.log('------------ products --------------------', products[options - 1]);
                                    modal.insertData('whatsapp_orders', 'user_id, number, item, quantity, address, order_time', `'${user_id}', '${number}', '${products[options - 1]}', '${0}', '${""}', '${orderTime}'`)
                                });
                            } else {
                                replyMessage = 'Please enter a valid response'
                                isValidText = false;
                                status = 'order'

                            }
                        } else {
                            status = 'order'
                            replyMessage = 'Please enter a valid response'
                            isValidText = false;
                        }
                    } else if (result['status'] == 'quantity') {
                        let options = parseInt(message.body)
                        if (Number.isInteger(options)) {
                            status = 'address'
                            if (options >= 1 && options <= 5) {
                                status = 'address'
                                replyMessage = "Please enter your address to confirm the order"
                                let quantity = options
                                modal.updateData('whatsapp_orders', `quantity='${quantity}', order_time='${orderTime}'`, `number LIKE '${number}'`, `id DESC LIMIT 1`)

                            } else {
                                replyMessage = 'Please enter a valid response'
                                status = 'quantity'
                                isValidText = false;
                            }
                        } else {
                            status = 'address'
                            replyMessage = 'Please enter a valid response'
                            isValidText = false;
                        }
                    } else if (result['status'] == 'address') {
                        let address = message.body
                        if (address.length > 10) {
                            status = 'ordered'
                            modal.selectData('whatsapp_orders', 'item', `number LIKE "${number}" ORDER BY id desc LIMIT 0, 1`, async (itemResult) => {
                                replyMessage = `Thanks for shopping with us 😊 \n Your order for *${itemResult['item']}* has been received and will be delivered within four days.\nHappy Shopping. `
                                message.reply(replyMessage);
                            });
                            modal.updateData('whatsapp_orders', `address='${address}', order_time='${orderTime}'`, `number LIKE '${number}'`, `id DESC LIMIT 1`)
                        } else {
                            status = 'address'
                            replyMessage = 'Please enter a valid response'
                            isValidText = false;
                        }
                    } else if (result['status'] == 'ordered') {
                        if (message.body.toLowerCase() === 'hello' || message.body.toLowerCase() === 'hi') {
                            replyMessage = modal.replyMessage(message.deviceType, 'welcome');
                            status = 'main'
                        }
                    } else if (result['status'] == 'feedback') {
                        const feedback = message.body
                        if (feedback.length > 1) {
                            status = ''
                            modal.selectData('whatsapp_orders', 'item', `number LIKE "${number}" ORDER BY id desc LIMIT 0, 1`, async (itemResult) => {
                                replyMessage = `*Thanks* for your valuable *feedback* 🙂!.`
                                message.reply(replyMessage);
                            });
                            modal.insertData('user_feedbacks', `name='${pushName}', number='${number}', feedback='${feedback}'`)
                        } else {
                            status = 'feedback'
                            replyMessage = 'Please enter a valid response'
                            isValidText = false;
                        }
                    } else if (result['status'] == '') {
                        if (message.body.toLowerCase() !== 'hello' || message.body.toLowerCase() !== 'hi') {
                            replyMessage = modal.replyMessage(message.deviceType, 'welcome');
                            status = 'main'
                        }
                    } else if (result['status'] == 'Auto Reply') {
                        replyMessage = "Thanks our *Team* will get back to you"
                        status = "";
                    }
                }

                if (isValidText) {
                    userMessage.push(message.body.trim());

                    let products = medias.map(media => media.text)

                    if (isProducts) {
                        modal.updateData(`whatsapp_user`, `status='${status}', messages='${JSON.stringify(userMessage)}', choice_category='${JSON.stringify(products)}'`, `number LIKE ${number}`)
                    } else {
                        // update
                        modal.updateData(`whatsapp_user`, `status='${status}', messages='${JSON.stringify(userMessage)}'`, `number LIKE ${number}`)
                    }
                }

                if (medias.length > 0) {
                    message.reply(replyMessage);

                    medias.map((mediaData, ind) => {
                        if (mediaData.media != '')
                            chat.sendMessage(mediaData.media, { caption: mediaData.text })
                        else
                            chat.sendMessage(mediaData.text)
                    })
                } else if (typeof replyMessage === "string" && replyMessage.length > 0) {
                    message.reply(replyMessage);
                } else {
                    client.sendMessage(message.from, replyMessage);
                }
            });
        } catch (error) {
            throw new Error(error.message);
        }
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

client.initialize();
 