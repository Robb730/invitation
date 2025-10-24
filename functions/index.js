/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// ✅ Configure your email transport (e.g. Gmail, Mailgun, etc.)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yourappemail@gmail.com", // replace with your sender email
    pass: "your-app-password", // use an App Password (not your Gmail password)
  },
});

// ✅ Cloud Function to send custom verification email
exports.sendCustomVerificationEmail = functions.https.onCall(async (data, context) => {
  const { email, displayName } = data;

  try {
    // Generate Firebase verification link
    const link = await admin.auth().generateEmailVerificationLink(email, {
      url: "https://yourapp.web.app/verified", // redirect URL after verification
      handleCodeInApp: true,
    });

    // Create your own email HTML
    const mailOptions = {
      from: '"KuboHub Team" <yourappemail@gmail.com>',
      to: email,
      subject: "Verify your KuboHub account",
      html: `
        <div style="font-family:sans-serif; padding:20px;">
          <h2>Hello ${displayName || "there"}!</h2>
          <p>Welcome to <strong>KuboHub</strong> 🌿</p>
          <p>To start exploring cozy stays and hosts, please verify your email:</p>
          <a href="${link}" style="background:#52734D; color:white; padding:10px 20px; border-radius:8px; text-decoration:none;">Verify Email</a>
          <p>If you didn’t create an account, you can safely ignore this email.</p>
          <br/>
          <p>— The KuboHub Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});


// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
