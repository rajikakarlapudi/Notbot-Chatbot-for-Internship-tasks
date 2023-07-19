// import pkg from 'body-parser';
// import twilio from 'twilio';

// const {urlencoded} = pkg


// const accountSid = 'AC452ee6f4ab694146ba5b36fce5744c0c';
// const authToken = '0ec16e62ea63c047ed346f7ed955db86';
// const client = twilio(accountSid, authToken);

// const app = express();
// const port = 3000;

// app.use(urlencoded({ extended: true }));

// // Webhook endpoint to receive incoming messages from Twilio
// app.post('/whatsapp-webhook', (req, res) => {
//   // Process incoming message here (chatbot logic)
// });

// client.messages.create({
//     body: 'watsup chatbot is working',
//     from: 'whatsapp:'+14155238886, // Use your Twilio-provisioned WhatsApp number
//     to: 'whatsapp:' + 9133669797 // Replace phone_number with the recipient's phone number
//   })
//   .then(message => console.log(`Message sent: ${message.sid}`))
//   .catch(err => console.error('Error sending message:', err));
  

// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });


const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const mongoose = require('mongoose');

const app = express();
const port = 2525;

app.use(bodyParser.urlencoded({ extended: false }));

// Twilio API setup
const accountSid = 'AC452ee6f4ab694146ba5b36fce5744c0c';
const authToken = '0ec16e62ea63c047ed346f7ed955db86';

const client = twilio(accountSid, authToken);

// Database connection setup (Assuming you are using MongoDB)

// Define the chat session schema and model
const chatSessionSchema = new mongoose.Schema({
  session_id: String,
  phone_number: String,
  name: String,
  email: String,
  experience: String
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

// Create a dictionary to store user sessions and their data
const user_sessions = {};

// Function to generate a unique session ID
function generateSessionID() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Function to handle incoming messages from Twilio WhatsApp webhook
function handleWhatsAppMessage(req, res) {
  const phone_number = req.body.From;
  const message_body = req.body.Body;

  if (message_body.toLowerCase() === 'yes' || message_body.toLowerCase() === 'no') {
    // If the user selects Yes or No for the Internship question
    createSessionAndAskName(phone_number);
  } else if (user_sessions[phone_number] && !user_sessions[phone_number].name) {
    // Name validation - If the user enters a number, ask the question again
    if (!isNaN(message_body)) {
      sendWhatsAppMessage(phone_number, "Invalid name format. Please enter your Name again.");
    } else {
      user_sessions[phone_number].name = message_body;
      sendWhatsAppMessage(phone_number, "Please enter your email ID?");
    }
  } else if (user_sessions[phone_number] && !user_sessions[phone_number].email) {
    // Email validation - If the user enters a number or name, ask the question again
    if (validateEmail(message_body)) {
      user_sessions[phone_number].email = message_body;
      sendWhatsAppMessage(phone_number, "Please select how many years of experience you have with Python/JS/Automation Development?\n1 year\n2 years\n3 years\n4 years\n5 years");
    } else {
      sendWhatsAppMessage(phone_number, "Invalid email format. Please enter your email ID again.");
    }
  } else if (user_sessions[phone_number] && !user_sessions[phone_number].experience) {
    // Save user's experience and end the conversation
    if (['1 year', '2 years', '3 years', '4 years', '5 years'].includes(message_body)) {
      user_sessions[phone_number].experience = message_body;
      saveToDatabase(user_sessions[phone_number]);
      delete user_sessions[phone_number]; // Clear the session after saving data
      sendWhatsAppMessage(phone_number, "Thanks for connecting. We will get back to you shortly.");
    }
  }
}

// Function to create a session and ask the user's name
function createSessionAndAskName(phone_number) {
  if (!user_sessions[phone_number]) {
    user_sessions[phone_number] = {
      session_id: generateSessionID(),
      name: null,
      email: null,
      experience: null
    };
  }

  sendWhatsAppMessage(phone_number, "Hi! Are you here to apply for the Internship?\n{{YES}} {{NO}}");
}

// Function to validate email format
function validateEmail(email) {
  // Simple email validation regex, you can use a more robust one
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Function to send WhatsApp messages using Twilio API
function sendWhatsAppMessage(phone_number, message) {
  client.messages.create({
    body: message,
    from: 'whatsapp:'+14155238886, // Twilio WhatsApp sandbox number
    to: 'whatsapp:' +916302773797// 
  })
  .then(message => console.log(`Message sent: ${message.sid}`))
  .catch(err => console.error('Error sending message:', err));
}

// Function to save chat session data to the database
function saveToDatabase(session_data) {
  const newSession = new ChatSession(session_data);
  newSession.save()
    .then(() => console.log('Chat session data saved to the database'))
    .catch((err) => console.error('Error saving chat session data:', err));
}

// Testing 
app.get('/testing',(req,res)=>{
    res.send("i'm working good")
})
// Webhook endpoint to receive incoming messages from Twilio
app.post('/whatsapp-webhook', handleWhatsAppMessage);

// Start the server

mongoose
.connect('mongodb+srv://srinivas:nMa0IxYqIchjgkPA@cluster0.xrblr.mongodb.net/?retryWrites=true&w=majority')
  .then(() => {
    console.log("Database connected!");
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch(() => {
    console.log("Unable to connect to database");
  });