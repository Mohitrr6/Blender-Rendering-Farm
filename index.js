import express from "express";
import multer from "multer";
import fs from "fs";
import bodyParser from "body-parser";
import pg from "pg";
import session from 'express-session';
import { Dropbox } from 'dropbox';


import { upload_to_dropbox } from './upload.js';
const dbx = new Dropbox({ accessToken: 'Your access token' });
const app = express();
const port = 3000;
app.set('view engine', 'ejs');

let Isauthorized = false;
app.use(session({
    secret: 'ratty', // Secret key to sign the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
}));
app.use(bodyParser.urlencoded({ extended: true }));
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        return cb(null, `${file.originalname}`)
    }
})
const upload = multer({ storage })
const db = new pg.Client({
    user: "postgres",
    host: 'localhost',
    database: 'project_db',
    password: '123456',
    port: '5432'
})
app.use(express.static("public"));
db.connect();

app.get("/", (req, res) => {

    res.render("index.ejs");
})
app.get("/Signup", (req, res) => {
    res.render("signup.ejs");
})
app.get("/login", (req, res) => {

    res.render("login.ejs");
})
app.post("/Signup", (req, res) => {
    const uname = req.body.Username;
    const pass_word = req.body.passcode;
    db.query("INSERT INTO register_login(email, password) VALUES($1, $2)", [uname, pass_word])
        .then(result => {
            console.log('Inserted data into database');
            res.status(200).send('Data inserted successfully');
            res.redirect("/dashboard");
        })
        .catch(error => {
            console.error('Error inserting data into database:', error);
            res.status(500).send('Error inserting data into database');
        });

});
app.get("/dashboard", (req, res) => {
    const u_name = req.session.username;


    db.query("SELECT projects_tag FROM project_detail WHERE username = $1", [u_name])
        .then(result => {
            const projects = result.rows;
            console.log(projects);
            if (Isauthorized) {
                res.render("dashboard.ejs", { u_name, projects });
            }
            else {
                res.redirect("/login")
            }
        })
        .catch(error => {
            console.error('Error retrieving project details:', error);
            // Handle error
        });




})
app.get("/upload", (req, res) => {
    Isauthorized = true;
    if (Isauthorized) {
        res.render("upload.ejs")
    }
})

app.post("/login", (req, res) => {
    let uname = req.body.username;
    const pass_word = req.body.passcode;
    req.session.username = uname;

    const result = db.query("SELECT * FROM register_login WHERE email = $1 AND password=$2", [uname, pass_word])
        .then(result => {
            // Check if the result contains any rows
            if (result.rows.length > 0) {
                Isauthorized = true;
                res.redirect("/dashboard");
            } else {
                res.status(404).send('Username does not exist');
            }
        })
        .catch(error => {
            console.error('Error checking username:', error);
            res.status(500).send('Error checking username');
        });
})

app.post('/upload', upload.single('blend_file'), function (req, res) {
    const filepath = "./uploads/config.txt";
    const start_f = req.body.first_frame;
    const last_f = req.body.last_frame;
    const engine = req.body.rend_engine;
    const proj_tag = req.body.proj_tag;
    const uname = req.session.username;
    db.query("INSERT INTO project_detail(username,projects_tag) VALUES($1,$2)", [uname, proj_tag])

    const data = `start: ${start_f}\nend: ${last_f}\nEngine: ${engine}\n`;

    fs.writeFile(filepath, data, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to save form values.');
        }
        console.log('Form values saved successfully.');
    });
    upload_to_dropbox();
    res.redirect("/dashboard");
    const listFiles = async () => {
        try {
            const response = await dbx.filesListFolder({ path: '/Apps/render-it/Apps/' });
            return response.result.entries;
        } catch (error) {
            console.error('Error listing files:', error);
            throw error;
        }
    };

    // Function to download the only .mkv file in the folder
    const downloadMkvFile = async () => {
        try {
            const files = await listFiles();
            const mkvFile = files.find(file => file.name.endsWith('.mkv'));
            if (!mkvFile) {
                console.log('No .mkv files found.');
                return;
            }
            const response = await dbx.filesDownload({ path: mkvFile.path_display });
            const fileBuffer = await response.result.fileBinary;
            fs.writeFileSync(mkvFile.name, fileBuffer);
            console.log('File downloaded successfully:', mkvFile.name);
            return true; // Indicate that the file has been successfully downloaded
        } catch (error) {
            console.error('Error downloading .mkv file:', error);
            return false; // Indicate that there was an error downloading the file
        }
    };

    // Function to repeatedly attempt to download the file every 30 seconds
    const attemptDownload = async () => {
        let success = false;
        while (!success) {
            success = await downloadMkvFile();
            if (!success) {
                console.log('Retrying in 60 seconds...');
                await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 30 seconds
            }
        }
    };

    // Call the main function
    attemptDownload();



})
app.get("/download", (req, res) => {
    const filePath = 'output0001-0010.mkv'; // Replace with the absolute path to your file
    res.download(filePath);

})



app.listen(port, () => {
    console.log(`Server is running on port ${[port]}`);
});