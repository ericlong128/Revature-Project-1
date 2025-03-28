const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({region: "us-east-2"});
const documentClient = DynamoDBDocumentClient.from(client);

const TableName = "Tickets";

async function createTicket(ticket){
    const ticketWithSortKey = {
        ...ticket,        
        sort_key: ticket.ticket_id 
    };

    const command = new PutCommand({
        TableName,
        Item: ticketWithSortKey
    });
    try{
        data = await documentClient.send(command);
        return data;
    }catch(err){
        console.error('Error in postTicket:', err);
        return null;
    }
}

async function getTicketsByUserId(userId) {
    const command = new QueryCommand({
        TableName,
        KeyConditionExpression: 'user_id = :user_id and begins_with(sort_key, :ticket_prefix)',
        ExpressionAttributeValues: {
            ':user_id': userId, 
            ':ticket_prefix': 'TICKET#'    
        }
    });

    try {
        const { Items } = await documentClient.send(command);
        return Items;  
    } catch (err) {
        console.error('Error in getTicketsByUserId:', err);
        return null;
    }
}

async function getTicketsByStatus(author, status) {

    const command = new QueryCommand({
        TableName,
        IndexName: 'StatusIndex',  
        KeyConditionExpression: '#status = :status',
        FilterExpression: '#user_id <> :author',  
        ExpressionAttributeNames: {
            '#status': 'status',
            '#user_id': 'user_id'  
        },
        ExpressionAttributeValues: {
            ':status': status,
            ':author': author  
        }
    });

    try {
        const { Items } = await documentClient.send(command);
        return Items;  
    } catch (err) {
        console.error('Error in getTicketsByStatus:', err);
        return null;
    }
}

async function updateTicketStatus(ticket) {
    console.log(ticket);
    try {
        const command = new PutCommand({
            TableName,
            Item: {
               ...ticket 
            }
        });
        await documentClient.send(command);
        return ticket; 
    } catch (err) {
        console.error('Error in updateTicketStatus:', err);
        return null;
    }
}
async function getTicketById(ticketId){
    const command = new QueryCommand({
        TableName,
        IndexName: 'TicketIdIndex', 
        KeyConditionExpression: 'ticket_id = :ticket_id',
        ExpressionAttributeValues: {
            ':ticket_id': ticketId
        }
    });

    try{
        const data = await documentClient.send(command);
        return data.Items ? data.Items[0] : null;
    }catch(err){
        console.error('Error in getTicketById:', err);
        return null;
    }
}


module.exports = {createTicket, getTicketsByUserId, getTicketsByStatus, getTicketById, updateTicketStatus };