# FilesPool

FilesPool is a simple web application that allows users to expose a local directory and provide a public URL for others
to download files from that directory. With this app, users can easily share files stored on their local machine without
having to upload them to a cloud storage service or send them through email.

## Usage

To use FilesPool, follow these steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/fauzanfebrian/FilesPool.git
    ```
2. Install the dependencies:
    ```bash
    cd FilesPool
    npm install
    ```
    for windows user:
    ```bash
    npm install -g win-node-env
    ```
3. Create file `.env` and copy the value from `.env.example`
4. Put the files that you want to expose in the `files` folder.
5. Start the server
    ```bash
    npm start
    ```
6. Open the link shown in your terminal to access the app and download files from the exposed directory.

Or another simpler step (slower download):

1. [Download Zip File](https://github.com/fauzanfebrian/FilesPool/archive/refs/heads/executable.zip)
2. Extract the zip & open the folder
3. Put the files that you want to expose in the "files" folder.
4. Open the executable file in the folder (look for your operating system)
5. Open the link shown to access the app and download files from the exposed directory.
