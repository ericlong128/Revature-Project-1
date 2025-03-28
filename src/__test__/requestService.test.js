const { v4: uuidv4 } = require('uuid');
const requestDao = require('../repository/requestDAO'); 
const logger = require('../util/logger'); 

const { createTicket, getTicketsByUserId, getTicketsByStatus, updateTicketStatus, getTicketById } = require('../service/requestService'); 

jest.mock('../repository/requestDAO');
jest.mock('../util/logger');
jest.mock('uuid');

describe('Ticket Service', () => {

    describe('createTicket', () => {
        it('should return an error message if ticket creation fails', async () => {
            const author = 'USER#123';
            const ticket = { description: 'This is a test', amount: 100, type: 'Bug' };
            requestDao.postTicket.mockResolvedValue(null);  

            const result = await createTicket(author, ticket);

            expect(result.code).toBe(400);
            expect(result.message).toBe('Failed to submit ticket');
            expect(logger.error).toHaveBeenCalledWith('Failed to submit ticket');
        });

        it('should create a ticket successfully', async () => {
            const author = 'USER#123';
            const ticket = { description: 'This is a test', amount: 100, type: 'Bug' };
            const newTicket = { ...ticket, ticket_id: 'TICKET#mock-uuid' };
            uuidv4.mockReturnValue('mock-uuid'); 
            requestDao.postTicket.mockResolvedValue(newTicket);  

            const result = await createTicket(author, ticket);

            expect(result.code).toBe(201);
            expect(result.message).toBe('Ticket submitted');
            expect(result.ticket.ticket_id).toBe('TICKET#mock-uuid');
            expect(requestDao.postTicket).toHaveBeenCalledWith(expect.objectContaining({
                ticket_id: 'TICKET#mock-uuid',
                user_id: author,
                description: ticket.description,
                amount: ticket.amount,
                status: 'Pending',
                type: ticket.type,
            }));
        });
    });

    describe('getTicketsByUserId', () => {
        it('should return an error message if tickets not found for user', async () => {
            const userId = 'USER#123';
            requestDao.getTicketsByUserId.mockResolvedValue(null);  

            const result = await getTicketsByUserId(userId);

            expect(result.code).toBe(400);
            expect(result.message).toBe('Failed to get tickets - not found');
            expect(logger.error).toHaveBeenCalledWith('Failed to get tickets - not found');
        });

        it('should return tickets successfully for a given user', async () => {
            const userId = 'USER#123';
            const tickets = [{ ticket_id: 'TICKET#mock-uuid', user_id: userId, status: 'Pending', description: 'Test Ticket' }];
            requestDao.getTicketsByUserId.mockResolvedValue(tickets);  

            const result = await getTicketsByUserId(userId);

            expect(result.code).toBe(200);
            expect(result.message).toBe('Tickets retrieved');
            expect(result.tickets).toEqual(tickets);
        });
    });

    describe('getTicketsByStatus', () => {
        it('should return an error message if tickets could not be retrieved (not if list is empty)', async () => {
            const status = 'Pending';
            const author = 'MANAGER Bob';
            const role = 'MANAGER';
            requestDao.getTicketsByStatus.mockResolvedValue(null);  

            const result = await getTicketsByStatus(author, role, status);

            expect(result.code).toBe(404);
            expect(result.message).toBe(`No tickets were found with status: ${status}`);
            expect(logger.error).toHaveBeenCalledWith(`No tickets were found with status: ${status}`);
        });
        it('should return an unauthorized message if user role is not a \'MANAGER\'', async () => {
            const status = 'Pending';
            const author = 'EMPLOYEE Bob';
            const role = 'EMPLOYEE';
            requestDao.getTicketsByStatus.mockResolvedValue(null);  

            const result = await getTicketsByStatus(author, role, status);

            expect(result.code).toBe(403);
            expect(result.message).toBe('Unauthorized');
            expect(logger.error).toHaveBeenCalledWith('Unauthorized');
        });

        it('should return tickets successfully for a given status', async () => {
            const status = 'Pending';
            const author = 'MANAGER Bob';
            const role = 'MANAGER';
            const tickets = [{ ticket_id: 'TICKET#mock-uuid', status: 'Pending', description: 'Test Ticket' }];
            requestDao.getTicketsByStatus.mockResolvedValue(tickets);  

            const result = await getTicketsByStatus(author, role, status);

            expect(result.code).toBe(200);
            expect(result.message).toBe('Tickets retrieved');
            expect(result.tickets).toEqual(tickets);
        });
    });

    describe('updateTicketStatus', () => {
        it('should return an error message if ticket status update fails', async () => {
            const ticket = { ticket_id: 'TICKET#mock-uuid', status: 'Pending' };
            const status = 'Resolved';
            requestDao.updateTicketStatus.mockResolvedValue(null);  

            const result = await updateTicketStatus(ticket, status);

            expect(result.code).toBe(404);
            expect(result.message).toBe('Failed to update ticket - not found');
            expect(logger.error).toHaveBeenCalledWith('Failed to update ticket - not found');
        });

        it('should update ticket status successfully', async () => {
            const ticket = { ticket_id: 'TICKET#mock-uuid', status: 'Pending' };
            const status = 'Resolved';
            const updatedTicket = { ...ticket, status };
            requestDao.updateTicketStatus.mockResolvedValue(updatedTicket);  

            const result = await updateTicketStatus(ticket, status);

            expect(result.code).toBe(200);
            expect(result.message).toBe('Ticket status updated');
            expect(result.ticket.status).toBe('Resolved');
        });
    });

    describe('getTicketById', () => {
        it('should return an error message if ticket not found', async () => {
            const ticketId = 'TICKET#mock-uuid';
            requestDao.getTicketById.mockResolvedValue(null);  

            const result = await getTicketById(ticketId);

            expect(result.code).toBe(404);
            expect(result.message).toBe('Failed to retrieve ticket');
            expect(logger.error).toHaveBeenCalledWith('Failed to retrieve ticket');
        });

        it('should retrieve ticket successfully by ID', async () => {
            const ticketId = 'TICKET#mock-uuid';
            const ticket = { ticket_id: ticketId, status: 'Pending', description: 'Test Ticket' };
            requestDao.getTicketById.mockResolvedValue(ticket);  

            const result = await getTicketById(ticketId);

            expect(result.code).toBe(200);
            expect(result.message).toBe('Ticket retrieved');
            expect(result.ticket.ticket_id).toBe(ticketId);
        });
    });

});