const request = require('supertest');
const express = require('express');
const userController = require('../controller/userController');
const userService = require('../service/userService'); 

jest.mock('../service/userService');
jest.mock('../util/authJWT');

const app = express();
app.use(express.json());
app.use('/user', userController);

jest.mock('../util/authJWT', () => ({
  authenticateJWT: (req, res, next) => {
    req.user = { user_id: '123' }; 
    next(); 
  },
}));

describe('POST /user/register', () => {
  it('should return 400 if username or password is missing', async () => {
      const response = await request(app)
          .post('/user/register')
          .send({ username: 'testUser' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username and password are required.');
  });

  it('should return 409 if the username already exists', async () => {
      userService.getUser.mockResolvedValue({ user: { username: 'testUser' } });

      const response = await request(app)
          .post('/user/register')
          .send({ username: 'testUser', password: 'password' });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Username already exists.');
  });

  it('should return 201 if user is successfully created', async () => {
      userService.getUser.mockResolvedValue({ user: null });
      userService.createUser.mockResolvedValue({ message: 'User created', user: { username: 'testUser' } });

      const response = await request(app)
          .post('/user/register')
          .send({ username: 'testUser', password: 'password' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created');
      expect(response.body.user.username).toBe('testUser');
  });
});

describe('POST /user/login', () => {
  it('should return 400 if username or password is missing', async () => {
      const response = await request(app)
          .post('/user/login')
          .send({ username: 'testUser' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username and password are required.');
  });

  it('should return 404 if user is not found', async () => {
      userService.loginUser.mockResolvedValue({ message: 'User not found' });

      const response = await request(app)
          .post('/user/login')
          .send({ username: 'testUser', password: 'password' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
  });

  it('should return 200 if login is successful', async () => {
      userService.loginUser.mockResolvedValue({ message: 'Login successful', token: 'some_token' });

      const response = await request(app)
          .post('/user/login')
          .send({ username: 'testUser', password: 'password' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBe('some_token');
  });

  it('should return 401 if login fails due to incorrect credentials', async () => {
      userService.loginUser.mockResolvedValue({ message: 'Incorrect credentials' });

      const response = await request(app)
          .post('/user/login')
          .send({ username: 'testUser', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Incorrect credentials');
  });
});

describe('PUT /user/password', () => {
  it('should return 400 if username or password is missing', async () => {
      const response = await request(app)
          .put('/user/password')
          .send({ username: 'testUser' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid request.');
  });

  it('should return 404 if user is not found', async () => {
      userService.getUser.mockResolvedValue({ user: null });

      const response = await request(app)
          .put('/user/password')
          .send({ username: 'testUser', password: 'newPassword' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
  });

  it('should return 200 if password is updated successfully', async () => {
    userService.getUser.mockResolvedValue({ user: { username: 'testUser' } });
    userService.updateUserPassword.mockResolvedValue({ message: 'Password updated', user: { username: 'testUser' } });

    const response = await request(app) 
        .put('/user/password')
        .send({ username: 'testUser', password: 'newPassword' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Password updated');
  });
});

describe('PUT /user/role', () => {
  
  it('should return 400 if username is not provided', async () => {
    const response = await request(app)
      .put('/user/role')
      .send({});  

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid request.');
  });

  it('should return 404 if user does not exist', async () => {
    userService.getUser.mockResolvedValue({ user: null });
    userService.updateUserRole.mockResolvedValue({ code: 404, message: "User not found" });

    const response = await request(app)
      .put('/user/role')
      .send({ username: 'nonExistingUser' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });

  it('should return 201 if role is updated successfully', async () => {
    const mockUser = { user: { username: 'testUser' }, userId: '123' };
    userService.getUser.mockResolvedValue(mockUser);

    const mockUpdateResponse = { message: 'Role updated', user: { username: 'testUser', role: 'admin' } };
    userService.updateUserRole.mockResolvedValue(mockUpdateResponse);

    const response = await request(app)
      .put('/user/role')
      .send({ username: 'testUser' });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Role updated');
    expect(response.body.user.username).toBe('testUser');
    expect(response.body.user.role).toBe('admin');
  });
});