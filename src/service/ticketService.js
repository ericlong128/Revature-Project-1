const requestDao = require("../DAO/ticketDAO");
const { v4: uuidv4 } = require('uuid');
const logger = require("../util/logger");

async function createTicket(author, ticket){
    const ticket_id = `TICKET#${uuidv4()}`;

    const newTicket = {
        ticket_id,
        user_id: author,
        description: ticket.description,
        amount: ticket.amount,
        status: 'Pending',
        type: ticket.type || 'Other',
        sort_key:  ticket_id,
        created:  new Date().toISOString()
    };

    const result = await requestDao.postTicket(newTicket);
    if(!result){
        logger.error("Failed to submit ticket")
        return {code:400, message: "Failed to submit ticket"};
    }else{
        logger.info("Ticket submitted", newTicket);
        return {code:201, message: "Ticket submitted", ticket: newTicket};
    }
}

async function getTicketsByUserId(userId){
    const result = await requestDao.getTicketsByUserId(userId);
    if(!result){
        logger.error("Failed to get tickets - not found")
        return {code:400, message: "Failed to get tickets - not found"};
    }else{
        logger.info("Tickets retrieved", result);
        return {code:200, message: "Tickets retrieved", tickets: result};
    }
}

async function getTicketsByStatus(author, role, status){
    const result = await requestDao.getTicketsByStatus(author, status);
    if(role != "MANAGER"){
        logger.error("Unauthorized")
        return {code:403, message: "Unauthorized"};
    }
    if(!result){
        logger.error(`No tickets were found with status: ${status}`)
        return {code:404, message: `No tickets were found with status: ${status}`};
    }else{
        logger.info("Tickets retrieved", result);
        return {code:200, message: "Tickets retrieved", tickets: result};
    }
}

async function updateTicketStatus(ticket, status){
    const result = await requestDao.updateTicketStatus(ticket, status);
    if(!result){
        logger.error("Failed to update ticket - not found")
        return {code:404, message: "Failed to update ticket - not found"};
    }else{
        logger.info("Ticket status updated", result);
        return {code:200, message: "Ticket status updated", ticket: result};
    }
}

async function getTicketById(ticket_id){
    const result = await requestDao.getTicketById(ticket_id);
    if(!result){
        logger.error("Failed to retrieve ticket")
        return {code:404, message: "Failed to retrieve ticket"};
    }else{
        logger.info("Ticket retrieved", result);
        return {code:200, message: "Ticket retrieved", ticket: result};
    }
}

module.exports = {createTicket, getTicketsByUserId, getTicketsByStatus, updateTicketStatus, getTicketById }