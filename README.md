Synthesizer Standalone MIDI Control
This project is a web-based synthesizer application with MIDI control, packaged as a standalone desktop application using Tauri.

Setup Instructions
To set up and run this application, you'll need to follow these steps:

1. Prerequisites
Before you begin, ensure you have the following installed on your system:

Node.js: It is recommended to use the latest LTS (Long Term Support) version. You can download it from nodejs.org.

Rust: Tauri uses Rust for its backend. You can install Rust by following the instructions on rust-lang.org. Make sure to install the rustup toolchain.

Yarn (optional but recommended): This project uses Yarn for package management. If you don't have it, you can install it globally:

npm install -g yarn

2. Clone the Repository
First, clone this repository to your local machine:

git clone <repository-url>
cd synthesizer-standalone-midi-control-6-23

Note: Replace <repository-url> with the actual URL of the GitHub repository.

3. Install Dependencies
Navigate into the cloned directory and install the project dependencies.

If you are using Yarn:

yarn install

If you are using npm:

npm install

4. Run the Web Application (Development)
You can run the web application in development mode directly in your browser. This is useful for front-end development.

yarn dev
# or
npm run dev

This will typically start a development server and open the application in your default web browser.

5. Run the Desktop Application with Tauri (Development)
To run the application as a desktop application using Tauri in development mode:

yarn tauri dev
# or
npm run tauri dev

This command will compile the Rust backend and launch the web application within a Tauri window.

6. Build the Desktop Application (Production)
To create a production-ready standalone desktop application:

yarn tauri build
# or
npm run tauri build

This command will compile the Rust backend and package the web application into an executable file for your operating system. The output will be located in the src-tauri/target/release/bundle/ directory.

Project Structure Highlights
src/: Contains the main React/TypeScript web application code.

src-tauri/: Contains the Rust source code for the Tauri backend, including the Cargo.toml (Rust project manifest) and tauri.conf.json (Tauri configuration).

audio/: Contains the Web Audio API related code, including AudioEngine.ts and various effects.

components/: React components for the user interface.

MIDI Control
This synthesizer is designed to work with MIDI devices. Ensure your MIDI device is connected and properly recognized by your operating system. The application should automatically detect available MIDI inputs.

Troubleshooting
Tauri Build Issues: If you encounter issues during the Tauri build process, ensure Rust is correctly installed and configured. Check the Tauri documentation for specific prerequisites for your operating system.

MIDI Device Not Detected: Verify your MIDI device is connected and its drivers are installed. Sometimes restarting the application or your computer can resolve detection issues.
