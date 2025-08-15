
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Staff = require('../models/Staff');

class StaffController {
  static async getAllStaff(req, res) {
    try {
      if (req.user.role !== 'deli-admin' && req.user.role !== 'super-admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const staff = await Staff.find().populate('userId', 'name email phone');
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async createStaff(req, res) {
    try {
      if (req.user.role !== 'deli-admin' && req.user.role !== 'super-admin') {
        return res.status(403).json({ message: 'Access denied' });
      }}
      catch(error){
        console.log("Error", error);
      }
    }

      
//       const { name, email, phone, password, role } = req.body;
      
//       // Create user account
//       const salt = await bcrypt.genSalt(10);
//       const hashedPassword = await bcrypt.hash(password, salt);
      
//       const user = new User({
//         name,
//         email,
//         phone,
//         password: hashedPassword,
//         role
//       });
      
//       await user.save();
      
//       // Create staff record
//       const staff = new Staff({
//         userId: user._id,
//         role,
//         status: 'active'
//       });
      
//       await staff.save();
//       res.status(201).json(staff);
//     } catch (error) {
//       res.status(500).json({ message: 'Server error' });
//     }
  

  static async updateStaffStatus(req, res) {
    try {
      const { status } = req.body;
      const staff = await Staff.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = StaffController;
