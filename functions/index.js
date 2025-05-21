// Este archivo debe desplegarse como una Cloud Function de Firebase
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

// Configuración del transporte de correo
// Las credenciales se configuran así:
// firebase functions:config:set gmail.user="tu@gmail.com" gmail.pass="tu_pass"
const transporter = nodemailer.createTransport({
  service: "gmail", // O el servicio que prefieras
  auth: {
    user: "raritytechinnovations@gmail.com",
    pass: "darudesanstorn1234!",
  },
});

// Cloud Function para enviar correos
exports.sendOrderEmail = functions.https.onRequest(async (req, res) => {
  // Habilitar CORS
  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    // Preflight request
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  try {
    const {to, subject, html} = req.body;

    if (!to || !subject || !html) {
      return res.status(400).send({error: "Faltan parámetros requeridos"});
    }

    // Configuración del correo
    const mailOptions = {
      from: "Toy Garage <tu-correo@gmail.com>",
      to,
      subject,
      html,
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    // Responder con éxito
    return res.status(200).send({success: true});
  } catch (error) {
    console.error("Error al enviar correo:", error);
    return res.status(500).send({error: "Error al enviar correo"});
  }
});
