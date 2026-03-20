### Testing with Cypress

- Install the project dependencies from the repository root.
- Run the app in development mode before starting the Cypress runner.
- The end-to-end suite targets Chrome-family browsers.
- The specs share the downloads folder, so run them serially.

<br>

Move to the Hatsmith app root directory:

`cd /workspace/hatsmith`

Install dependencies:

`npm install`

Run the app in development environment:

`npm run dev`

Start Cypress interactive testing:

`npm run test`

Run the Cypress suite headlessly:

`npx cypress run --browser chrome`
