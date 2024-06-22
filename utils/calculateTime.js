function calculateAvailableTimes(openTime, closeTime, duration) {
  openTime = new Date(openTime);
  closeTime = new Date(closeTime);
  let availableTimes = [];
  while (openTime < closeTime) {
    availableTimes.push(openTime.toTimeString().split(" ")[0].substring(0, 5));
    openTime.setMinutes(openTime.getMinutes() + duration);
  }
  return availableTimes;
}

module.exports = calculateAvailableTimes;
