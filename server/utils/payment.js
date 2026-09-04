const calculatePaystackAmount = (baseAmount) => Math.round(baseAmount * 1.02);
const calculateFee = (baseAmount) => Math.round(baseAmount * 0.02);

module.exports = {
  calculatePaystackAmount,
  calculateFee
};
