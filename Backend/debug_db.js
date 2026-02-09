import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from './model/teamSchema.js';
import User from './model/userSchema.js';

dotenv.config();

async function debug() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskapp');
    console.log('Connected to DB');

    const users = await User.find();
    console.log('Users found:', users.map(u => ({ id: u._id, email: u.email })));

    const teams = await Team.find();
    console.log('Teams found:', teams.map(t => ({ id: t._id, name: t.name, creator: t.creator, members: t.members.length })));

    if (users.length > 0) {
        const firstUser = users[0];
        const userTeams = await Team.find({
            $or: [
                { creator: firstUser._id },
                { "members.user": firstUser._id }
            ]
        });
        console.log(`Teams for user ${firstUser.email}:`, userTeams.length);
    }

    await mongoose.disconnect();
}

debug();
