const { List } = require('whatsapp-web.js');
const mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "tutorwand-bot"
});

// Mysql methods
const selectData = (tableName, columnName = '*', where = '', callback) => {
    let query = `SELECT ${columnName} FROM ${tableName}`
    if (where != '') {
        query += ` WHERE ${where}`
    }

    con.query(`${query}`, function (err, result, fields) {
        if (err) throw err;
        callback(result[0])
    });
}

const insertData = (tableName, columnName, values) => {
    let query = `INSERT INTO ${tableName} (${columnName}) VALUES (${values})`;
    con.query(query, function (err, result) {
        if (err) { console.log(err); return false; }
        return true
    });
}

const updateData = (tableName, dataUpdate, where = '', order = '') => {
    let sql = `UPDATE ${tableName} SET ${dataUpdate}`;
    if (where != '') {
        sql += `  WHERE ${where}`
    }

    if (order != '') {
        sql += ` ORDER BY ${order}`
    }

    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log(result.affectedRows + " record(s) updated");
    });
}

let selectWelcomeData = [
    {
        title: "Choose any one",
        rows: [
            {id: '1', title: "Contact us"},
            {id: '2', title: "Order items"},
            {id: '3', title: "Know our working hours"},
            {id: '4', title: "Get our address"},
            {id: '5', title: "Send feedback"},
            {id: '0', title: "Exit"}
        ]    
    }
];

let categoryCatalogue = [
    {
        title: "Choose any one category",
        rows: [
            {id: '1', title: "Swaddle"},
            {id: '2', title: "Burp Clothes"},
            {id: '3', title: "Nursing Pillow"},
            {id: '4', title: "Snuggle Pillow"},
            {id: '0', title: "Go Back"}
        ]    
    }
]

// let contactButton = new Buttons(
    //     "You can contact us through phone or e-mail.\n\n*Phone*: +91 6268422834 \n*E-mail* :  info@Tutorwandlabel.in"
    //     [
    //         {body: 'Call'},
    //         {body: 'Drop a mail'}
    //     ],
    //     "TutorWand Contact",
    //     "Thanks \n Team TutorWand"
    // )

const replyMessage = (deviceType, messageType) => {
    let contactButton = "You can contact us through phone or e-mail.\n\n*Phone*: +91 6268422834 \n*E-mail* :  info@Tutorwandlabel.in";
    let returnMsg = ''
    switch (messageType) {
        case 'welcome':
            if(deviceType === 'web') {
                returnMsg = "Hi, thanks for contacting *Tutorwand*.\nYou can choose from one of the options below: \n\n*Type*\n\n 1️⃣ To *contact* us \n 2️⃣ To *order* items \n 3️⃣ To know our *working hours* \n 4️⃣ To get our *address* \n 5️⃣ To send *feedback* \n 0️⃣ To *exit*"
            } else {
                returnMsg = new List(
                    "Hi, thanks for contacting *Tutorwand*.",
                    "Choose an option",
                    selectWelcomeData,
                    'Welcome to TutorWand',
                    'Thanks'
                )
            }
            break;
        case 'category':
            if(deviceType === 'web') {
                returnMsg = "You can select one of the following categories to order: \n\n1️⃣ Swaddle  \n2️⃣ Burp Clothes \n3️⃣ Nursing Pillow \n4️⃣ Snuggle Pillow \n0️⃣ Go Back";
            } else {
                returnMsg = new List(
                    "You can select one of the following categories to order",
                    "Choose a category",
                    categoryCatalogue,
                )
            }
            break;
        case 'contact':
            if(deviceType === 'web') {
                contactButton = "You can contact us through phone or e-mail.\n\n*Phone*: +91 6268422834 \n*E-mail* :  info@Tutorwandlabel.in"; 
            } else {
                contactButton = "You can contact us through phone or e-mail.\n\n*Phone*: +91 6268422834 \n*E-mail* :  info@Tutorwandlabel.in";
            }
            break;
        default:
            break;
            
    }

    return returnMsg;

}

const messageSearch = (message, options, type) => {
    let searchString = ''
    switch (type) {
        case 'welcome':
            searchString = selectWelcomeData[0].rows[options].title
            break;
        case 'category':
            searchString = categoryCatalogue[0].rows[options].title
            break;
        default:
            break;
    }
    console.log(message.trim(), searchString.trim());
    if(message.trim() == searchString.trim()) {
        return true;
    }
    return false;
}

module.exports = { selectData, insertData, updateData, replyMessage, messageSearch };
