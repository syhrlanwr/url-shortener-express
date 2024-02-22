const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Model = require('./model/model');
const Str = require('@supercharge/strings').Str;
const validUrl = require('valid-url');
const flash = require('express-flash');
const session = require('express-session');

dotenv.config();
const mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to the database');
    }
);

function isValidUrl(string) {
    if (validUrl.isUri(string)) {
        return true;
    }
    else {
        return false;
    }
}

function isGeneratedUrlExists(string) {
    Model.findOne({urlShortId: string}).then((result) => {
        if (result) {
            return true;
        }
        else {
            return false;
        }
    });
}


app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use(flash());
app.use(session({
    secret : 'secret',
    resave : false,
    saveUninitialized : false
    })
);

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

app.get('/', (req, res) => {
    Model.find().then((result) => {
        res.render('index', {urls: result});

    });
});

const domain = 'http://localhost:3000/';

app.post('/shorten', (req, res) => {
    const url = req.body.url;
    if (!isValidUrl(url)) {
        req.flash('error', 'Invalid URL');
        res.redirect('/');
    }
    else {
        const urlShortId = Str.random(6);
        while (true) {
            if (isGeneratedUrlExists(urlShortId)) {
                urlShortId = Str.random(6);
            }
            else {
                break;
            }
        }
        const newUrl = new Model({
            urlOriginal: url,
            urlShort: domain + urlShortId,
            urlShortId: urlShortId
        });
        try {
            newUrl.save();
            req.flash('success', 'URL shortened');
            res.redirect('/');
        }
        catch (err) {
            res.status.json({message: err});
        }    
    }
});

app.get('/:urlShortId', (req, res) => {
    const urlShortId = req.params.urlShortId;
    Model.findOne({urlShortId: urlShortId}).then((result) => {
        if (result) {
            result.clicks++;
            result.save();
            res.redirect(result.urlOriginal);
        }
        else {
            res.status(404).json({message: 'URL not found'});
        }
    });
});

app.post('/delete', (req, res) => {
    const urlShortId = req.body.urlShortId;
    Model.findOneAndDelete({urlShortId: urlShortId}).then((result) => {
        if (result) {
            req.flash('success', 'URL deleted');
            res.redirect('/');
        }
        else {
            res.status(404).json({message: 'URL not found'});
        }
    })    
});



app.listen(3000, () => {
    console.log('Server is running on port 3000');
    }
);