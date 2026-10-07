const Notification = require("../models/Notification");

// Sends a notification to specific students. Failures are logged and
// never break the request that triggered the notification.
async function notifyStudents(studentIds, { title, message, type }) {
  const recipients = studentIds.filter(Boolean);

  if (recipients.length === 0) return;

  try {
    await Notification.create({
      title,
      message,
      type,
      audience: "Student",
      recipients,
    });
  } catch (error) {
    console.error("Notification Error:", error);
  }
}

module.exports = { notifyStudents };
