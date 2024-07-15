import Dropbox from 'dropbox';
import fs from "fs";

// Initialize Dropbox client with access token
const dbx = new Dropbox.Dropbox({ accessToken: 'Your access token' });

async function upload_to_dropbox() {
    // Read the content of the first text file


    const blendFile = await fs.promises.readFile('./uploads/example.blend');
    const config_txt = await fs.promises.readFile('./uploads/config.txt', 'utf-8');

    // Specify the destination folder path on Dropbox
    const destinationFolderPath = '/Apps/render-it'; // Adjust as needed

    // Specify the filenames

    const blendFile_Name = 'example.blend';
    const config_txt_name = 'config.txt';

    // Specify the full path including the folder and filename for each file

    const dropboxFilePath1 = `${destinationFolderPath}/${blendFile_Name}`;
    const dropboxFilePath2 = `${destinationFolderPath}/${config_txt_name}`;

    // Upload the first file to Dropbox

    dbx.filesUpload({ path: dropboxFilePath1, contents: blendFile })
        .then((response) => {
            console.log('File 1 uploaded successfully:', response);
        })
        .catch((error) => {
            console.error('Error uploading file 1:', error);
        });
    // Upload the second file to Dropbox
    dbx.filesUpload({ path: dropboxFilePath2, contents: config_txt })
        .then((response) => {
            console.log('File 2 uploaded successfully:', response);
        })
        .catch((error) => {
            console.error('Error uploading file 2:', error);
        });

}

export { upload_to_dropbox };
