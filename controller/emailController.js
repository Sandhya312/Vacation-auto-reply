
const { google } = require("googleapis");
const { authenticate } = require("@google-cloud/local-auth");

const path = require("path");
const fs = require("fs").promises;

const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.labels",
    "https://mail.google.com/",
  ];
  
  const labelName = "Vacation";
const emailController = async (req, res) => {
    const auth = await authenticate({
      keyfilePath: path.join(__dirname, "../credentials.json"),
      scopes: SCOPES,
    });
  
  
    const gmail = google.gmail({ version: "v1", auth });
  
  
   
    const response = await gmail.users.labels.list({
      userId: "me",
    });
  
  
  
    const getUnreplyMsgs = async (auth)=> {
      const gmail = google.gmail({ version: "v1", auth });
      const response = await gmail.users.messages.list({
        userId: "me",
        labelIds: ["INBOX"],
        q: "is:unread",
      });
      
      return response.data.messages || [];
    }
  
 
   const createLabel = async (auth)=> {
      const gmail = google.gmail({ version: "v1", auth });
      try {
        const response = await gmail.users.labels.create({
          userId: "me",
          requestBody: {
            name: labelName,
            labelListVisibility: "labelShow",
            messageListVisibility: "show",
          },
        });
        return response.data.id;
      } catch (error) {
        if (error.code === 409) {
          const response = await gmail.users.labels.list({
            userId: "me",
          });
          const label = response.data.labels.find(
            (label) => label.name === labelName
          );
          return label.id;
        } else {
          throw error;
        }
      }
    }
  
    const Mainfunct =async ()=> {
      const labelId = await createLabel(auth);
      console.log(`Label  ${labelId}`);
      setInterval(async () => {
        const messages = await getUnreplyMsgs(auth);
        console.log("Unreply messages", messages);
        if (messages && messages.length > 0) {
          for (const message of messages) {
            const messageData = await gmail.users.messages.get({
              auth,
              userId: "me",
              id: message.id,
            });
  
            const email = messageData.data;
            const hasReplied = email.payload.headers.some(
              (header) => header.name === "In-Reply-To"
            );
  
            if (!hasReplied) {
            
              const replyMessage = {
                userId: "me",
                resource: {
                  raw: Buffer.from(
                    `To: ${
                      email.payload.headers.find(
                        (header) => header.name === "From"
                      ).value
                    }\r\n` +
                      `Subject: Re: ${
                        email.payload.headers.find(
                          (header) => header.name === "Subject"
                        ).value
                      }\r\n` +
                      `Content-Type: text/plain; charset="UTF-8"\r\n` +
                      `Content-Transfer-Encoding: 7bit\r\n\r\n` +
                      `Thank you for your email. I'm currently enjoy my vacation and I will get back to you soon... .\r\n`
                  ).toString("base64"),
                },
              };
  
              await gmail.users.messages.send(replyMessage);
  
              // Add label and move the email
              await gmail.users.messages.modify({
                auth,
                userId: "me",
                id: message.id,
                resource: {
                  addLabelIds: [labelId],
                  removeLabelIds: ["INBOX"],
                },
              });
            }
          }
        }
      }, Math.floor(Math.random() * (120 - 45 + 1) + 45) * 1000);
    }
  
  
    
    Mainfunct();
    const labels = response.data.labels;
    res.json({ "this is Auth": auth });
  }


  module.exports = emailController;