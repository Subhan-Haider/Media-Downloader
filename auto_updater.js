const { execSync, exec } = require('child_process');

// How often to check for updates (in milliseconds). Set to 24 hours (every day)
const POLL_INTERVAL = 24 * 60 * 60 * 1000; 

function checkForUpdates() {
    console.log(`[${new Date().toISOString()}] Checking GitHub for new code...`);

    try {
        // 1. Fetch the latest info from GitHub without downloading the code yet
        execSync('git fetch origin main');

        // 2. Check if our local code is behind the GitHub code
        const status = execSync('git status -uno').toString();

        if (status.includes('Your branch is behind')) {
            console.log('🌟 New code found on GitHub! Starting update...');

            // 3. We are behind! Pull the code and rebuild
            // IMPORTANT: Replace 'my-next-app' with your actual pm2 name if using PM2
            const updateCommand = `
                git pull origin main && 
                npm install && 
                npm run build && 
                pm2 restart my-next-app
            `;

            exec(updateCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ Update Failed: ${error.message}`);
                    return;
                }
                console.log(`✅ Update Successful!\n${stdout}`);
            });

        } else {
            console.log('No new updates found.');
        }

    } catch (error) {
        console.error(`Failed to check git status: ${error.message}`);
    }
}

// Start the polling loop
console.log(`Starting Auto-Updater. Checking every ${POLL_INTERVAL / 1000} seconds...`);
setInterval(checkForUpdates, POLL_INTERVAL);

// Do an initial check right when it starts
checkForUpdates();
