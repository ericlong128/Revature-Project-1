const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-2' || process.eng.AWS_DEFAULT_REGION});
const ssm = new AWS.SSM();

async function getJWTSecret() {
  
    try {
        const parameter = await ssm.getParameter({
          Name: 'jwt-secret-key',
          WithDecryption: true,
        }).promise();

      return parameter.Parameter.Value;
    } catch (err) {
      return res.status(500).json({ message: 'Unable to retrieve Secret Key' });
    }
}

module.exports = {getJWTSecret};