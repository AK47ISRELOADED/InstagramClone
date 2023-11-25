const nodemailer = require("nodemailer");
const googleApis = require("googleapis");
const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const CLIENT_ID = `1098493340515-0rcktqfv71ph0cc1pcjn9hvu16eph9aa.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REFRESH_TOKEN = `1//044p3Z8zzOgYvCgYIARAAGAQSNwF-L9IrOWpK6LeRYZUCHBYAVEnrfAZ7oxANI_oh33fG6kTBSzs067VjSDXEwawkrvgsWNyqvN0`;

const authClient = new googleApis.google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI);
authClient.setCredentials({refresh_token:REFRESH_TOKEN});

async function mailer(reciver,id,key){
 try{
        const ACCRSS_TOKEN = await authClient.getAccessToken();
        const transport =  nodemailer.createTransport({
            service:"gmail",
            auth:{
                type:"OAuth2",
                user:"adarshkaurav47@gmail.com",
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken:REFRESH_TOKEN,
                accessToken:ACCRSS_TOKEN
            }
        })
        const details = {
            from: "adarsh kaurav <adarshkaurav47@gmail.com>",
            to: "adarshkaurav69@gmail.com",
            subject: "heyy",
            text: "hello",
            html : `<h2>hey user you can recover this account by clicking this link :-
            <a href="http://localhost:3000/forgot/${id}/${key}">http://localhost:3000/forgot/${id}/${key}</a> </h2>`,
        }
        const result = await transport.sendMail(details);
        return result;
    }
    catch(err){
        return err;
    }
}

module.exports = mailer;