
class PaymentController {
  // Mock payment methods
  static paymentMethods = [];

  static async getUserPaymentMethods(req, res) {
    try {
      const userMethods = PaymentController.paymentMethods.filter(pm => pm.userId === req.user.id);
      res.json(userMethods);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async addPaymentMethod(req, res) {
    try {
      const { type, cardNumber, expiryDate, holderName } = req.body;
      
      const paymentMethod = {
        id: Date.now().toString(),
        userId: req.user.id,
        type,
        cardNumber: cardNumber.replace(/\d(?=\d{4})/g, '*'),
        expiryDate,
        holderName,
        isDefault: PaymentController.paymentMethods.filter(pm => pm.userId === req.user.id).length === 0
      };
      
      PaymentController.paymentMethods.push(paymentMethod);
      res.status(201).json(paymentMethod);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async processPayment(req, res) {
    try {
      const { orderId, amount, paymentMethodId } = req.body;
      
      // Mock payment processing
      const payment = {
        id: Date.now().toString(),
        orderId,
        amount,
        status: 'completed',
        transactionId: `txn_${Date.now()}`,
        createdAt: new Date()
      };
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = PaymentController;
