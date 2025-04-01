const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

// Print a section header
function printHeader(text) {
    console.log(`\n${colors.bright}${colors.blue}=== ${text} ===${colors.reset}\n`);
}

// Print success message
function printSuccess(text) {
    console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

// Print info message
function printInfo(text) {
    console.log(`${colors.cyan}ℹ ${text}${colors.reset}`);
}

// Print warning message
function printWarning(text) {
    console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

// Print error message
function printError(text) {
    console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

// Create an example .env file if it doesn't exist
function createEnvFile() {
    const envPath = path.join(__dirname, '.env');

    if (!fs.existsSync(envPath)) {
        const envContent = `# PocketBase Configuration
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
`;

        fs.writeFileSync(envPath, envContent);
        printSuccess('.env file created');
    } else {
        printInfo('.env file already exists');
    }
}

// Main setup function
function setup() {
    console.clear();
    printHeader('Item Tracker Setup');

    try {
        // Create .env file
        createEnvFile();

        // Install dependencies
        printHeader('Installing dependencies');
        execSync('pnpm install', { stdio: 'inherit' });
        printSuccess('Dependencies installed');

        // Print instructions for PocketBase
        printHeader('PocketBase Setup Instructions');
        printInfo('1. Download PocketBase from https://pocketbase.io/docs/');
        printInfo('2. Extract the executable and run it with:');
        console.log('   ./pocketbase serve');
        printInfo('3. Access the admin UI at http://127.0.0.1:8090/_/');
        printInfo('4. Create an admin account');
        printInfo('5. Configure collections:');
        console.log('   - users (Auth collection with name field)');
        console.log('   - items (name: text, user: relation to users)');
        console.log('   - prices (item: relation to items, price: number)');

        // Print run instructions
        printHeader('Running the Application');
        printInfo('1. Start the development server:');
        console.log('   pnpm dev');
        printInfo('2. Open http://localhost:3000 in your browser');

        console.log('\n');
        printSuccess('Setup complete!');
        console.log('\n');
    } catch (error) {
        printError(`Setup failed: ${error.message}`);
        process.exit(1);
    }
}

// Run the setup
setup(); 