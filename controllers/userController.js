
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RecentActivities = require('../models/RecentActivities');

class UserController {
  // get all users limit=6
  static async getAllUser(req,res){
 try {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find().skip(skip).limit(limit)
      .populate('restaurantId', 'name')
      .populate('deliCompanyId', 'name'),
    User.countDocuments()
  ]);
  // const users = await User.find()
  // .populate('restaurantId', 'name')
  // .populate('deliCompanyId', 'name');
  if (!users || users.length === 0) {
    return res.status(404).json({ message: 'No users found' });
  }
  res.json({
    message: 'Fetched users successfully',
    data: users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
    // res.status(200).json({ message: 'Fetched users', data: users });
  } 
  );
}
  catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error:' });
  }
    }

    static async getAllStaffByCompanyId(req,res){
      try {
        const deliCompanyId= req.params.companyId;
        const page= parseInt(req.query.page) || 1;
        const limit= parseInt(req.query.limit) || 6;
        const skip=(page-1) * limit;
        const query = {
          deliCompanyId: deliCompanyId,
          role: 'deli-staff'
        };
        const [users,total]= await Promise.all([
          User.find(query).skip(skip).limit(limit)
          .populate('restaurantId','name')
          .populate('deliCompanyId','name'),
          User.countDocuments(query)
        ]);
        if(!users || users.length ===0 ){
          return res.status(404).json({message :"No user Found"});
        }
        res.json({
          message: 'Fetched users successfully',
          data: users,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
          // res.status(200).json({ message: 'Fetched users', data: users });
        } 
        );
      } catch (error) {
       console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error:', error : error.message }); 
      }
    }

    static async getAllStaffsByCompanyId(req, res) {
      try {
        const deliCompanyId = req.params.companyId;
        const query = {
          deliCompanyId: deliCompanyId,
          role: 'deli-staff'
        };

        const users = await User.find(query)
          .populate('restaurantId', 'name')
          .populate('deliCompanyId', 'name');

        if (!users || users.length === 0) {
          return res.status(404).json({ message: "No user found" });
        }

        res.status(200).json({
          message: 'Fetched users successfully',
          data: users
        });
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
      }
    }

  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async updateProfile(req, res) {
    console.log("updateProfile",req.body);
  try {
    const { name, email, phone, address,role,restaurantId,deliCompanyId } = req.body;
    const userId = req.params.id; // Get user ID from route parameter
    console.log("userId",userId);

    // Accept only fields that are present in req.body
    const updateFields = {};
    const allowedFields = ['name', 'email', 'phone', 'address', 'role', 'restaurantId', 'deliCompanyId'];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(userId, updateFields, { new: true }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await RecentActivities.create({
      action: "Updated User Profile",
      userId: req.params.id, // actor
      target: user._id       // updated profile
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

static async deleteProfile(req, res) {
  try {
    const userId = req.params.id; // Get user ID from route parameter
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' , error: error.message });
  }
}

static async changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password is invalid or too short' });
    }

    console.log("Setting new plain password:", newPassword);  

    user.password = newPassword; 

    await user.save();
    await RecentActivities.create({
      action: "Changed Password",
      userId: req.params.userId,
      target: user._id
    })
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}



}

module.exports = UserController;
