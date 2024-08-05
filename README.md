## Description

System to handle receiving location data every 5 seconds, broadcasting it to clients via socket.io, and storing it in the PostgreSQL database. By using clustering, it can handle multiple concurrent connections, supporting up to 1000 requests per 5 seconds, depending on the hardware and configuration of your server.


## Installation

```bash
$ npm install express socket.io pg dotenv
```

## Running the app

```bash
# development
$ npm run --workspace=server start
$ npm run --workspace=dataserver start