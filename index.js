const express = require("express");
const axios = require("axios");
const nodeCron = require("node-cron");
const nodemailer = require("nodemailer");

const app = express();
const port = 313;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function logRoute(req, res, next) {
  const route = req.originalUrl;
  const method = req.method;
  const ip = req.connection.remoteAddress.replace('::ffff:', '');
  const dateTime = new Date().toLocaleString();

  console.log(`Route called: ${route} - Request Method: ${method} - IP: ${ip} - DateTime: ${dateTime}`);

  next();
}

app.use(logRoute);

const smtpConfig = {
  host: "host",
  port: 587,
  secure: false,
  auth: {
    user: "user",
    pass: "pass",
  },
};

const transporter = nodemailer.createTransport(smtpConfig);

transporter.verify((error, success) => {
  if (error) {
    console.error("Error verifying transporter:", error);
  } else {
    console.log("Transporter verified successfully");
  }
});

async function getPrayerTimes() {
  try {
    const response = await axios.get(
      "http://api.aladhan.com/v1/timingsByCity",
      {
        params: {
          city: "Beirut",
          country: "Lebanon",
          method: 12, // Calculation method (12 for Shia Ithna Ashari)
          tune: 0, // Tune the prayer times (+/- minutes)
          school: 0, // Calculation school (0 for Ithna Ashari)
        },
      }
    );

    return response.data.data.timings;
  } catch (error) {
    console.error("Error fetching prayer times:", error.message);
    return null;
  }
}

nodeCron.schedule("* * * * *", async () => {
  const prayerTimes = await getPrayerTimes();
  if (prayerTimes) {
    const currentTime = new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Beirut",
      hour12: false,
    });

    const currentPrayer = Object.entries(prayerTimes).find(
      ([prayerName, prayerTime]) => {
        const [prayerHour, prayerMinute] = prayerTime.split(":");
        const [currentHour, currentMinute] = currentTime.split(":");
        return prayerHour === currentHour && prayerMinute === currentMinute;
      }
    );

    if (currentPrayer) {
      const [prayerName] = currentPrayer;
      let mailOptions;
      if (["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].includes(prayerName)) {
        mailOptions = {
          from: "from",
          to: "to",
          subject: `Prayer Time Alert: ${prayerName}`,
          text: `حيّ على الصلاة\nIt is prayer time. ${prayerName}`,
        };
      } else {
        mailOptions = {
          from: "from",
          to: "to",
          subject: `${prayerName} Arrived!`,
          text: `${prayerName} is here. Current time is ${new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" })}`,
        };
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent:", info.response);
          console.log("Email body:", mailOptions.text);
        }
      });

      console.log(
        `It is prayer time. ${prayerName} current time : ${currentTime}`
      );
    } else {
      console.log(`No prayer now. Monitoring is resumed.   ${currentTime}`);
    }
  }
});


app.get("/prayer-times", async (req, res) => {
  const prayerTimes = await getPrayerTimes();
  if (prayerTimes) {
    const currentTime = new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Beirut",
      hour12: false,
    });

    res.status(200).json({ prayerTimes, currentTime });
  } else {
    res.status(500).json({ error: "Failed to fetch prayer times" });
  }
});

app.get("/qibla-direction", async (req, res) => {
  try {
    const response = await axios.get(
      "http://api.aladhan.com/v1/qibla",
      {
        params: {
          latitude: req.query.latitude,
          longitude: req.query.longitude,
        },
      }
    );

    const qiblaDirection = response.data.data.direction;
    res.json({ qiblaDirection });
  } catch (error) {
    console.error("Error fetching Qibla direction:", error.message);
    res.status(500).json({ error: "Failed to fetch Qibla direction" });
  }
});

app.get("/hijri-date", async (req, res) => {
  try {
    const response = await axios.get(
      "http://api.aladhan.com/v1/gToH",
      {
        params: {
          date: req.query.date,
        },
      }
    );

    const hijriDate = response.data.data.hijri.date;
    res.json({ hijriDate });
  } catch (error) {
    console.error("Error fetching Hijri date:", error.message);
    res.status(500).json({ error: "Failed to fetch Hijri date" });
  }
});

app.get("/monthly-calendar", async (req, res) => {
  try {
    const response = await axios.get(
      "http://api.aladhan.com/v1/gToH",
      {
        params: {
          year: req.query.year,
          month: req.query.month,
        },
      }
    );

    const monthlyCalendar = response.data.data.hijri;
    res.json({ monthlyCalendar });
  } catch (error) {
    console.error("Error fetching monthly calendar:", error.message);
    res.status(500).json({ error: "Failed to fetch monthly calendar" });
  }
});

app.get("/hijri-date/current", async (req, res) => {
  try {
    const currentDate = new Date().toISOString().split("T")[0];
    const response = await axios.get(
      "http://api.aladhan.com/v1/gToH",
      {
        params: {
          date: currentDate,
        },
      }
    );

    const hijriDate = response.data.data.hijri.date;
    res.json({ hijriDate });
  } catch (error) {
    console.error("Error fetching Hijri date:", error.message);
    res.status(500).json({ error: "Failed to fetch Hijri date" });
  }
});

app.get("/monthly-calendar/current", async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Months are zero-based

    const response = await axios.get(
      "http://api.aladhan.com/v1/gToH",
      {
        params: {
          year: currentYear,
          month: currentMonth,
        },
      }
    );

    const monthlyCalendar = response.data.data.hijri;
    res.json({ monthlyCalendar });
  } catch (error) {
    console.error("Error fetching monthly calendar:", error.message);
    res.status(500).json({ error: "Failed to fetch monthly calendar" });
  }
});



app.get("/", (req, res) => {
  res.status(200).send("Welcome to the prayer API! Select a route.");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
