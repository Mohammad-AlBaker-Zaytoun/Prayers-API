# Prayers-API
API that will help every muslim with his prayers

It has many features:

1- /prayer-times: Route for getting all prayer times of current day. Response is in JSON.

2- /qibla-direction: Route for getting the qibla direction according to your coordinates.

3- /hijri-date: Route for getting the hijri date of a day of your choice.

4- /hijri-date/current: Route for getting the hijri date of current day.

5- /monthly-calendar: Route for getting the monthly calender of a month of your choice.

6- /monthly-calendar/current: Route for getting the monthly calender of current month.

Also there is a job scheduled to run every minute that checks prayer times and sends email alerts to users of your choice when a prayer time arrives. It also send email alerts on Imsak, Sunrise, Midnight, Firstthird, Lastthird.

Regards.
