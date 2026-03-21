import msg91 from "msg91";

const msg91Client = msg91(
  process.env.MSG91_AUTH_KEY,
  "RRNAGAR",      // your sender ID
  4               // route
);

export default async function sendWhatsapp(to, message) {
  try {
    await msg91Client.sendWhatsapp({
      flow_id: process.env.MSG91_WHATSAPP_FLOW_ID,
      recipients: [
        {
          mobiles: to,
          VAR1: message
        }
      ]
    });

    console.log("WhatsApp sent to:", to);
  } catch (err) {
    console.error("WHATSAPP ERROR:", err);
  }
}
