const http = require('http');
const { exec } = require('child_process');

const PORT = 8080; // The port your webhook listens on

const server = http.createServer((req, res) => {
    // We only care about POST requests sent to the /webhook URL
    if (req.method === 'POST' && req.url === '/webhook') {
        console.log('Received push notification from GitHub!');

        // 1. Tell GitHub we received the request successfully
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Webhook received! Updating server...\n');

        // 2. Run the commands to update your server automatically
        // Replace 'my-next-app' with your actual pm2 process name
        const updateCommand = `
            git pull origin main && 
            npm install && 
            npm run build && 
            pm2 restart my-next-app
        `;

        exec(updateCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error during update: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Update stderr: ${stderr}`);
            }
            console.log(`Update output:\n${stdout}`);
            console.log('Server successfully updated!');
        });

    } else {
        // Ignore any other requests to this port
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Webhook listener is running on port ${PORT}...`);
});
