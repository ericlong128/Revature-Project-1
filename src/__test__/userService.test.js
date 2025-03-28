const { createUser, loginUser, getUser, updateUserPassword, updateUserRole } = require('../service/userService');
const userDao = require("../repository/userDAO");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('../util/logger');
const { getJWTSecret } = require('../util/getJWTKey');

// Mocking external modules
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../repository/userDAO');
jest.mock('../util/logger');
jest.mock('../util/getJWTKey');

jest.mock('../util/authJWT', () => ({
    authenticateJWT: (req, res, next) => {
      req.user = { user_id: '123',  }; 
      next(); 
    },
}));

describe('User Service Functions', () => {
    // beforeEach(() => {
    //     jest.clearAllMocks();
    // });

    describe('createUser', () => {
        it('should return an error message if username or password is too short', async () => {
            const user = { username: '', password: '' };
            const result = await createUser(user);
            expect(result.message).toBe('Username or password is too short');
        });

        it('should create a user successfully', async () => {
            const user = { username: 'testuser', password: 'testpass', role: 'EMPLOYEE' };
            const hashedPassword = 'hashedpassword';
            bcrypt.hash.mockResolvedValue(hashedPassword);
            userDao.postUser.mockResolvedValue({ user_id: '123', username: 'testuser', password: hashedPassword, role: 'EMPLOYEE' });

            const result = await createUser(user);

            expect(result.message).toBe('User created');
            expect(result.user.username).toBe('testuser');
            expect(userDao.postUser).toHaveBeenCalled();
        });

        it('should return an error message if user creation fails', async () => {
            const user = { username: 'testuser', password: 'testpass', role: 'EMPLOYEE' };
            bcrypt.hash.mockResolvedValue('hashedpassword');
            userDao.postUser.mockResolvedValue(null);

            const result = await createUser(user);

            expect(result.message).toBe('Failed to create user');
        });
    });

    describe('loginUser', () => {
        it('should return error if user not found', async () => {
            userDao.getUserByUsername.mockResolvedValue(null);
            const result = await loginUser('nonexistentuser', 'password');
            expect(result.message).toBe('User not found');
        });

        it('should return error if password is incorrect', async () => {
            userDao.getUserByUsername.mockResolvedValue({ username: 'testuser', password: 'hashedpassword' });
            bcrypt.compare.mockResolvedValue(false);
            const result = await loginUser('testuser', 'wrongpassword');
            expect(result.message).toBe('Invalid credentials');
        });

        it('should return token if login is successful', async () => {
            userDao.getUserByUsername.mockResolvedValue({ user_id: '123', username: 'testuser', password: 'hashedpassword' });
            bcrypt.compare.mockResolvedValue(true);
            const mockSecret = 'secretkey';
            getJWTSecret.mockResolvedValue(mockSecret);
            jwt.sign.mockReturnValue('jwt-token');
            
            const result = await loginUser('testuser', 'testpass');
            expect(result.message).toBe('Login successful');
            expect(result.token).toBe('jwt-token');
        });

        it('should handle errors gracefully', async () => {
            userDao.getUserByUsername.mockRejectedValue(new Error('Database error'));
            const result = await loginUser('testuser', 'testpass');
            expect(result.message).toBe('An error occurred');
        });
    });

    describe('getUser', () => {
        it('should return an error if username is too short', async () => {
            const result = await getUser('');
            expect(result.message).toBe('Username is too short');
        });

        it('should return user if found', async () => {
            userDao.getUserByUsername.mockResolvedValue({ user_id: '123', username: 'testuser', role: 'EMPLOYEE' });
            const result = await getUser('testuser');
            expect(result.message).toBe('User found');
            expect(result.user.username).toBe('testuser');
        });

        it('should return an error if user not found', async () => {
            userDao.getUserByUsername.mockResolvedValue(null);
            const result = await getUser('nonexistentuser');
            expect(result.message).toBe('No user was found');
        });
    });

    describe('updateUserPassword', () => {
        it('should return an error if user not found', async () => {
            userDao.getUserById.mockResolvedValue(null);
            const result = await updateUserPassword('123', 'newpassword');
            expect(result.message).toBe('User not found');
            
        });

        it('should update password successfully', async () => {
            const user = { user_id: '123', username: 'testuser', role: 'EMPLOYEE', password: 'oldpassword' };
            userDao.getUserById.mockResolvedValue(user);
            bcrypt.hash.mockResolvedValue('newhashedpassword');
            userDao.updatePassword.mockResolvedValue(user);

            const result = await updateUserPassword('123', 'newpassword');
            expect(result.message).toBe('Password updated for user: 123');
        });

        it('should handle errors while updating password', async () => {
            userDao.getUserById.mockResolvedValue({ user_id: '123', username: 'testuser', role: 'EMPLOYEE' });
            bcrypt.hash.mockResolvedValue('newhashedpassword');
            userDao.updatePassword.mockRejectedValue(new Error('Update error'));

            const result = await updateUserPassword('123', 'newpassword');
            expect(result.message).toBe('An error occurred while updating password.');
        });
    });

    describe('updateUserRole', () => {
        it('should return 403 if the user is not authorized', async () => {
            const req = { user: { role: 'EMPLOYEE' } };
    
            const result = await updateUserRole(req, 'testuser');  
    
            expect(result.code).toBe(403);
            expect(result.message).toBe('User not authorized');
        });
    
        it('should return user not found if the user does not exist', async () => {
            const req = { user: { role: 'MANAGER' } };
            userDao.getUserByUsername.mockResolvedValue(null);
    
            const result = await updateUserRole(req, 'nonexistentuser');  
    
            expect(result.message).toBe('User not found');
        });
    
        it('should update the role successfully', async () => {
            const req = { user: { role: 'MANAGER' } };
            const user = { user_id: '123', username: 'testuser', role: 'EMPLOYEE' };
            userDao.getUserByUsername.mockResolvedValue(user);
            userDao.updateRole.mockResolvedValue(user);
    
            const result = await updateUserRole(req, 'testuser'); 
    
            expect(result.message).toBe('Role updated for user: 123');
        });
    
        it('should handle errors during role update', async () => {
            const req = { user: { role: 'MANAGER' } };
            const user = { user_id: '123', username: 'testuser', role: 'EMPLOYEE' };
            userDao.getUserByUsername.mockResolvedValue(user);
            userDao.updateRole.mockRejectedValue(new Error('Update error'));
    
            const result = await updateUserRole(req, 'testuser'); 
    
            expect(result.message).toBe('An error occurred while updating role.');
        });
    });
});