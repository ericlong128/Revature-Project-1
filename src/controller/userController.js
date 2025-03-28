const express = require('express');
const router = express.Router();
const userService = require('../service/userService');
const { authenticateJWT } = require('../util/authJWT');

router.post("/register", async (req, res) => {
    const { username, password, role = 'EMPLOYEE' } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.', data:JSON.stringify(req.body)});
    }
    const existingUser = await userService.getUser(username);
    if (existingUser.user) {
        return res.status(409).json({ message: 'Username already exists.' });
    }

    const newUser = { username, password, role };
    let data = await userService.createUser(newUser);

    return res.status(201).json({ message: data.message, user:data.user });
});

router.post("/login", async (req, res) => {
    const {username, password} = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const data = await userService.loginUser(username, password);
    if(data.token){
        res.status(200).json({message: data.message, token: data.token});
    }else{
        if(data.message === "User not found"){
            return res.status(404).json({message: data.message})
        }
        res.status(401).json({message: data.message});
    }
})

router.put("/password", authenticateJWT, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password || password.length < 1 || username != req.user.username) { // this is the new password, not the current one
        return res.status(400).json({ message: 'Invalid request.' });
    }
    
    const existingUser = await userService.getUser(username);
    if (!existingUser.user) {
        return res.status(404).json({ message: "User not found" });
    }
    const data = await userService.updateUserPassword(req.user.user_id, password);
    return res.status(data?.code || 200).json({ message:data.message, user: data.user });
});

router.put("/role", authenticateJWT, async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'Invalid request.' });
    }
    const data = await userService.updateUserRole(req, username);
    return res.status(data?.code || 201).json({ message:data?.message, user: data.user });
});

module.exports = router;