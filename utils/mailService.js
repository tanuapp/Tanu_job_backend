const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const mailerSend = new MailerSend({
  apiKey:
    "mlsn.042a75fd881a782c670f347c764b0c1298899536c16c5204842b6f10a9f921f0",
});

const sendEmail = async (email, name) => {
  const sentFrom = new Sender(
    "info@trial-z3m5jgrwrzoldpyo.mlsender.net",
    "Tanusoft"
  );
  const recipients = [
    new Recipient("ddulguun493@gmail.com", "Customer", {
      support_url: "https://tanu.mn",
      "account.name": "Dulguun",
    }),
  ];
  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject("Баталгаажуулах код")
    .setTemplateId("v69oxl579vd4785k");
  // .setText("This is the text content");

  await mailerSend.email.send(emailParams);
};
module.exports = {
  sendEmail,
};
