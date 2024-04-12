exports.addSeconds = (date, seconds) => {
  const newDate = new Date(date);
  newDate.setSeconds(newDate.getSeconds() + seconds);
  return newDate;
};

exports.addDays = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

exports.addMonths = (date, months) => {
  const newDate = new Date(date);
  newDate.setMonths(newDate.getMonth() + months);
  return newDate;
};

exports.converToLocalTime = (serverDate) => {
  var dateStr =
    serverDate.getFullYear() +
    "-" +
    (serverDate.getMonth() + 1) +
    "-" +
    serverDate.getDate() +
    " " +
    serverDate.getHours() +
    ":" +
    String(serverDate.getMinutes()).padStart(2, "0") +
    ":" +
    String(serverDate.getSeconds()).padStart(2, "0");
  return dateStr;
};
