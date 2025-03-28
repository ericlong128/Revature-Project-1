const express = require('express');
const router = express.Router();
const requestService = require('../service/ticketService');
const { authenticateJWT } = require('../util/authJWT');


router.post('/', authenticateJWT, async (req, res) => {

    const { author = req.user.user_id, description, type="Other", amount } = req.body;
    
    if (!description || !amount || !author) {
        return res.status(400).json({ message: 'Invalid request.' });
    }
    const newTicket = { author, description, type, amount }
    let data = await requestService.createTicket(author, newTicket);
    
    return res.status(data.code || 200).json({ message: data.message, ticket: data.ticket });
});

router.get('/', authenticateJWT, async (req, res) => {
    
    const userId = req.user.user_id;

    const data = await requestService.getTicketsByUserId(userId); 

    return res.status(data.code || 200).json({message: data.message, tickets:data.tickets});
});

router.get('/:status', authenticateJWT, async (req, res) => {
    const author = req.user.user_id; // the author is the current user, and they must be logged in
    const role = req.user.role;
    let status = req.params.status; 
    
    if (!status){
        status = "Pending";
    }

    const data = await requestService.getTicketsByStatus(author, role, status);

    return res.status(data.code || 200).json({ message: data.message, tickets:data.tickets  });
});

router.put('/update', authenticateJWT, async (req, res) => {
    const {ticket_id, status } = req.body;
    
    if((status != "Approved" && status != "Denied" )|| !ticket_id || !status){
        return res.status(400).json({ message: 'Invalid update request' });
    }
    let updateTicket = await requestService.getTicketById(ticket_id);
    
    if(updateTicket?.code === 400 || updateTicket?.ticket.status != "Pending"){
        return res.status(400).json({message:"Invalid request"})
    }
    updateTicket.ticket.status = status;
    let data = await requestService.updateTicketStatus(updateTicket.ticket);
    
    return res.status(data.code || 200).json({ message: data.message, ticket: updateTicket.ticket });
});

module.exports = router;