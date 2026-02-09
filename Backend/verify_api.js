const BASE_URL = 'http://localhost:5000/api';

async function verify() {
    console.log('--- Starting API Verification ---');

    try {
        // 1. Register a user
        const regRes = await fetch(`${BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: `test${Date.now()}@example.com`,
                password: 'password123'
            })
        });
        const regData = await regRes.json();
        console.log('Register User:', regData.success ? 'SUCCESS' : 'FAILED', regData.message);

        if (!regData.success) return;

        // 2. Login
        const loginRes = await fetch(`${BASE_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: regData.data.email,
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login User:', loginData.success ? 'SUCCESS' : 'FAILED', loginData.message);

        if (!token) return;

        // 3. Create a team
        const teamRes = await fetch(`${BASE_URL}/teams/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-token': token
            },
            body: JSON.stringify({ name: 'Alpha Team' })
        });
        const teamData = await teamRes.json();
        console.log('Create Team:', teamData.success ? 'SUCCESS' : 'FAILED');

        const teamId = teamData.team?._id;
        if (!teamId) return;

        // 4. Create a task
        const taskRes = await fetch(`${BASE_URL}/teams/${teamId}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-token': token
            },
            body: JSON.stringify({
                title: 'Test Task',
                description: 'Verify this works'
            })
        });
        const taskData = await taskRes.json();
        console.log('Create Task:', taskData.success ? 'SUCCESS' : 'FAILED');

        const taskId = taskData.task?._id;

        // 5. List tasks
        const listRes = await fetch(`${BASE_URL}/teams/${teamId}/tasks`, {
            method: 'GET',
            headers: { 'x-user-token': token }
        });
        const listData = await listRes.json();
        console.log('List Tasks:', listData.success ? 'SUCCESS' : 'FAILED', `Count: ${listData.tasks?.length}`);

        console.log('--- API Verification Completed ---');
    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verify();
