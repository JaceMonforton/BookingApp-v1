const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const router = express.Router();
const jwt = require("jsonwebtoken");
const authMiddleware = require('../middleware/authMiddleware');
const Session = require('../models/classesModel');

router.post('/register', async (req, res) => {
  try {
    const userExists = await User.findOne({ email: req.body.email });

    if (userExists) {
      return res.status(200).json({ message: 'Email is already in use', success: false });
    }

    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword, 
    });

    await newUser.save();

    res.status(201).json({ message: 'User created successfully', success: true });
  } catch (error) {
    console.error('Error creating user:', error);
    res
    .status(500)
    .send({ message: 'Error creating user', success: false, error });
  }
});

router.post('/login', async (req, res) => {
  try {

   const user = await User.findOne({email: req.body.email})

   if (!user) {
    return res
    .status(200)
    .send({message: "User Does not Exist" , success: false})
   }

   const  isMatch = await bcrypt.compare(req.body.password, user.password);
   if (!isMatch) {
    return res
    .status(200)
    .send({message: "Password is incorrect" , success: false})
   }else {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET , {
      expiresIn: '1d',
    })
    res
    .status(200)
    .send({ message: "Login Successful" , success: true, data: token });
   }
  } catch (error) {
    console.log(error);
    console.error('Error during login:', error);
    res.status(500).send({ message: 'Error during login', success: false, error });
  }
});

router.post('/get-user-info-by-id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.password = undefined;

    if (!user) {
      return res.status(200).send({ message: "User does not exist", success: false });
    } else {
      return res.status(200).send({
        success: true,
        data: user,
      });
    }
  } catch (error) {
    res.status(500).send({ message: "Error Getting User info", success: false, error });
  }
});

router.post('/sessions', authMiddleware, async (req, res) => {
    try {
        const newSession = new Session({...req.body});
        await newSession.save();
        res.status(200).json({ success: true, message: "Session created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find();
    res.json(sessions);

  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/sessions/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId;
  console.log('Received sessionId:', sessionId);

  try {
    const deletedSession = await Session.findOneAndDelete({ _id: sessionId });
    if (deletedSession.deletedCount === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json({ message: 'Session deleted successfully', deletedSession });

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const user = await User.findOneAndUpdate(
      { _id: user._id },
      {
        $push: {
          unseenNotifications: {
            type: 'session-cancellation',
            message: `${sessionId} has been cancelled`,
            data: {
              classTitle: session.classTitle,
              date: session.date,
              startTime: session.startTime,
              endTime: session.endTime,
            },
            onClickPath: '/user/sessions/cancellations',
          },
        },
      },
      { new: true } 
    );
    
    await user.save();


  } catch (error) {
    console.error('Error deleting session:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid session ID format' });
    }
  }
});

router.post('/sessions/:sessionId/register', async (req, res) => {
  const sessionId = req.params.sessionId;
  const { userId, name } = req.body;

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }


    if (!user.hasSignedWaiver.signedwaiver) {
      return res.status(400).json({error: "Must Sign Waiver First"})
    }

    if (user.registeredClasses.includes(sessionId)) {
      return res.status(400).json({ error: 'User is already registered for this session' });
      console.log("Already Registered");

    }


    if (user.registeredClasses.length >=2 ) {
      return res.status(400).json({error: "Users can only register for 1 class at a time."});
    }



    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      { $push: { registeredUsers: { userId, name } } },
      { new: true }
    );

    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    user.registeredClasses.push(updatedSession);
    await user.save();

    const adminUser = await User.findOne({ isAdmin: true });
    const unseenNotifications = adminUser.unseenNotifications;
    unseenNotifications.push({
      type: 'user-registration',
      message: `${user.name} has registered for the class with id: ${sessionId}`,
      data: {
        name: user.name,
        userId: user._id,
      },
      onClickPath: '/trainers/sessions',
    });

    await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });


    const trainerUser = await User.findOne({ isTrainer: true });
    const trainerNotis = trainerUser.unseenNotifications;
    trainerNotis.push({
      type: 'user-registration',
      message: `${user.name} has registered for the class with id: ${sessionId}`,
      data: {
        name: user.name,
        userId: user._id,
      },
      onClickPath: '/trainers/sessions',
    });

    await User.findByIdAndUpdate(trainerUser._id, { trainerNotis });

    res.status(200).json({ message: 'User registered successfully', updatedSession });
  } catch (error) {
    console.error('Error registering user for session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId;

  try {
    const detailedSession = await Session.findById(sessionId);

    if (!detailedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(detailedSession);
  } catch (error) {
    console.error('Error fetching session details:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/sessions/:sessionId/registerUser/:userId', async (req, res) => {
  const { sessionId, userId } = req.params;

  try {
    const user = await User.findById(userId);
    const session = await Session.findById(sessionId);

    if (!user || !session) {
      return res.status(404).json({ error: 'User or session not found' });
    }

    const isUserRegistered = user.registeredClasses.some(entry => entry.updatedSession.toString() === sessionId);

    if (isUserRegistered) {
      return res.status(400).json({ error: 'User is already registered for this session' });
    }

    const populatedSession = await session.populate('updatedSession').execPopulate();

    console.log('Populated Session:', populatedSession);
    user.registeredClasses.push({
      updatedSession: populatedSession,
    });

    await user.save();

    res.status(200).json({ message: `User with id ${userId} registered successfully`, updatedSession: populatedSession });
  } catch (error) {
    console.error('Error registering user for session:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid session ID or user ID format' });
    }

    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:userId/registered-classes', async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId).populate('registeredClasses.updatedSession').exec();

    if (!user) {
      return res.status(404).json({ error: 'User not found or no registered classes' });
    }

    const registeredClasses = user.registeredClasses.map(entry => entry.updatedSession);
    res.status(200).json(user.registeredClasses);
  } catch (error) {
    console.error('Error fetching registered classes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/sessions/:sessionId/:userId/cancel', async (req, res) => {
  const sessionId = req.params.sessionId;
  const userId = req.params.userId;

  console.log('Received sessionId for cancellation:', sessionId);
  console.log('Received userId for cancellation:', userId);

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('User not found. userId:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      { $pull: { registeredUsers: { userId } } },
      { new: true } 
    );
       

    if (!updatedSession) {
      console.error('Error updating session:', updatedSession);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { registeredClasses: { updatedSession: user.updatedSession } } },
      { new: true }
    );


    if (!updatedUser) {
      console.error('Error updating user:', updatedUser);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    console.log('Session canceled successfully', sessionId);
    res.status(200).json({ message: 'Session canceled successfully' , session });

    
    const trainerUser = await User.findOne({ isTrainer: true });
    const trainerNotis = trainerUser.unseenNotifications;
    trainerNotis.push({
      type: 'user-registration',
      message: `${user.name} has Cancelled the class with id: ${sessionId}`,
      data: {
        name: user.name,
        userId: user._id,
      },
      onClickPath: '/trainers/sessions/cancelled',
    });

    await User.findByIdAndUpdate(trainerUser._id, { trainerNotis });

  } catch (error) {
    console.error('Error deleting session:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid session ID format' });
    }

  }
});

router.get('/:userId/notifications', async(req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);

    const unseenNotifications = user.unseenNotifications.map(entry => entry.unseenNotifications);
    res.status(200).json(unseenNotifications);

  } catch (error) {
    
  }
})

router.delete('/:userId/notifications/delete', async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await User.updateOne(
      { _id: userId },
      { $set: { unseenNotifications: [] } }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ error: 'User not found or no notifications to delete' });
    }

    res.status(200).json({ count: result.nModified });
  } catch (error) {
    console.error('Error deleting unseen notifications:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.post('/:userId/signed-waiver', async (req, res) => {
  const userId = req.params.userId;
  const { hasSignedWaiver } = req.body;
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.hasSignedWaiver.signedwaiver) {
      return res.status(400).json({ error: "Can't sign the waiver more than once." });
    }

    const signature = hasSignedWaiver.signature;
    
    if (!signature) {
      return res.status(400).json({ error: "Must include signature to sign the waiver." });
    }

    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "hasSignedWaiver.signedwaiver": true,
          "hasSignedWaiver.signature": signature
        }
      },
      { new: true }
    );

    const updatedUser = await User.findById(userId);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(updatedUser.hasSignedWaiver.signedwaiver);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
