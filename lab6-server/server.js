require("dotenv").config();

const path = require("path");
const fastify = require("fastify")({ logger: true });
const fastifyStatic = require("@fastify/static");
const nodemailer = require("nodemailer");

const PORT = process.env.PORT || 3000;

fastify.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/"
});

const transporter = nodemailer.createTransport({
  host: "in-v3.mailjet.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILJET_API_KEY,
    pass: process.env.MAILJET_SECRET_KEY
  }
});

fastify.post("/api/contact", async (request, reply) => {
  const { name, email, subject, message } = request.body;

  if (!name || !email || !subject || !message) {
    return reply.code(400).send({
      success: false,
      message: "Заповніть усі поля форми"
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return reply.code(400).send({
      success: false,
      message: "Некоректний email"
    });
  }

  try {
    await transporter.sendMail({
      from: `"Lab 6 Site" <${process.env.MAIL_FROM}>`,
      to: process.env.MAIL_TO,
      subject: `Повідомлення з сайту: ${subject}`,
      text: `Ім'я: ${name}\nEmail: ${email}\nТема: ${subject}\n\nПовідомлення:\n${message}`,
      replyTo: email
    });

    return reply.code(200).send({
      success: true,
      message: "Повідомлення успішно надіслано"
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: "Помилка під час надсилання повідомлення"
    });
  }
});

fastify.listen({ port: PORT, host: "0.0.0.0" }, (error, address) => {
  if (error) {
    fastify.log.error(error);
    process.exit(1);
  }

  console.log(`Server is running on ${address}`);
});