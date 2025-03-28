const request = require('supertest');
const express = require('express');
const ticketController = require('../controller/requestController');
const requestService = require('../service/requestService');

jest.mock('../service/requestService');
jest.mock('../util/authJWT', () => ({
  authenticateJWT: (req, res, next) => {
    req.user = { user_id: '123' }; 
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/ticket', ticketController);

describe('POST /ticket', () => {
  it('should return 400 if description or amount is missing', async () => {
    const response = await request(app)
      .post('/ticket')
      .send({ description: 'Test Ticket' }); 

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid request.');
  });

  it('should create a ticket successfully', async () => {
    const newTicket = {
      description: 'Test Ticket',
      type: 'Bug',
      amount: 100,
      author: 'USER#123',
    };

    const createdTicket = {
      ticket_id: 'TICKET#mock-uuid',
      ...newTicket,
      status: 'Pending',
    };
    requestService.createTicket.mockResolvedValue({
      code: 201,
      message: 'Ticket submitted',
      ticket: createdTicket,
    });

    const response = await request(app)
      .post('/ticket')
      .send(newTicket);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Ticket submitted');
    expect(response.body.ticket.ticket_id).toBe(createdTicket.ticket_id);
  });
});

describe('GET /ticket', () => {
  it('should return 200 and tickets for a user', async () => {
    const tickets = [{ ticket_id: 'TICKET#mock-uuid', status: 'Pending', description: 'Test Ticket' }];
    requestService.getTicketsByUserId.mockResolvedValue({
      code: 200,
      message: 'Tickets retrieved',
      tickets,
    });

    const response = await request(app)
      .get('/ticket')
      .set('Authorization', 'Bearer mock-token'); 

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Tickets retrieved');
    expect(response.body.tickets).toEqual(tickets);
  });

  it('should return 400 if no tickets are found for a user', async () => {
    requestService.getTicketsByUserId.mockResolvedValue({
      code: 400,
      message: 'Failed to get tickets - not found',
    });

    const response = await request(app)
      .get('/ticket')
      .set('Authorization', 'Bearer mock-token'); 

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Failed to get tickets - not found');
  });
});

describe('GET /ticket/:status', () => {
  it('should return 200 and tickets for a given status', async () => {
    const status = 'Pending';
    const tickets = [{ ticket_id: 'TICKET#mock-uuid', status: 'Pending', description: 'Test Ticket' }];
    requestService.getTicketsByStatus.mockResolvedValue({
      code: 200,
      message: 'Tickets retrieved',
      tickets,
    });

    const response = await request(app)
      .get(`/ticket/${status}`)
      .set('Authorization', 'Bearer mock-token'); 

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Tickets retrieved');
    expect(response.body.tickets).toEqual(tickets);
  });

  it('should return 404 if no tickets are found for status', async () => {
    const status = 'Denied';
    requestService.getTicketsByStatus.mockResolvedValue({
      code: 404,
      message: 'Failed to get tickets - not found',
    });

    const response = await request(app)
      .get(`/ticket/${status}`)
      .set('Authorization', 'Bearer mock-token'); 

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Failed to get tickets - not found');
  });
});

describe('PUT /ticket/update', () => {
  it('should return 400 if ticket_id or status is missing', async () => {
    const response = await request(app)
      .put('/ticket/update')
      .send({ status: 'Approved' }); 

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid update request');
  });

  it('should return 400 if status is invalid', async () => {
    const response = await request(app)
      .put('/ticket/update')
      .send({ ticket_id: 'TICKET#mock-uuid', status: 'InvalidStatus' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid update request');
  });

  it('should return 400 if ticket is not found or already processed', async () => {
    const ticket = { ticket_id: 'TICKET#mock-uuid', status: 'Pending' };
    requestService.getTicketById.mockResolvedValue({
      code: 400,
      message: 'Failed to retrieve ticket',
    });

    const response = await request(app)
      .put('/ticket/update')
      .send({ ticket_id: ticket.ticket_id, status: 'Approved' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Failed to retrieve ticket');
  });

  it('should return 200 if ticket status was successfully updated', async () => {
    const ticket = { ticket_id: 'TICKET#mock-uuid', status: 'Pending' };
    requestService.getTicketById.mockResolvedValue({
      code: 200,
      message: 'Ticket retrieved',
      ticket,
    });
    requestService.updateTicketStatus.mockResolvedValue({
      code: 200,
      message: 'Ticket status updated',
      ticket: { ...ticket, status: 'Approved' },
    });

    const response = await request(app)
      .put('/ticket/update')
      .send({ ticket_id: ticket.ticket_id, status: 'Approved' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Ticket status updated');
    expect(response.body.ticket.status).toBe('Approved');
  });
});