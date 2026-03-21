/// <reference types="cypress" />
// The app has to be running in dev mode
// Tests are done on chrome
// Avoid running all test files at the same time

import { currentVersion } from "../../src/config/Constants";

const path = require("path");
const downloadsFolder = Cypress.config("downloadsFolder");
const documentFixture = {
  contents: Cypress.Buffer.from("This is a Hatsmith Cypress test document.\n", "utf8"),
  fileName: "document.txt",
  mimeType: "text/plain",
  lastModified: Date.now(),
};

let aliceKeys = { publicKey: null, privateKey: null };
let bobKeys = { publicKey: null, privateKey: null };

const downloadCurrentFile = (selector) => {
  cy.intercept("/", (req) => {
    req.reply((res) => {
      expect(res.statusCode).to.equal(200);
    });
  });

  cy.window().then((win) => {
    win.document.addEventListener(
      "click",
      () => {
        setTimeout(() => {
          win.location.reload();
        }, 2500);
      },
      { once: true },
    );
    cy.get(selector).click({ force: true });
  });
};

describe("Asymmetric encryption test", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.contains("Hatsmith");
    cy.contains(currentVersion);
  });

  it("loads a file and generate keys for two parties then encrypt", () => {
    cy.wait(2500);
    cy.contains("Choose files to encrypt");
    cy.get(".submitFile").should("be.disabled");
    cy.get("#enc-file").selectFile(documentFixture, { force: true });
    cy.get(".submitFile").click({ force: true });

    cy.wait(500);
    cy.contains("Choose a strong Password");
    cy.get(".submitKeys").should("be.disabled");
    cy.get(".publicKeyInput").click({ force: true });
    cy.contains("Generate now").click({ force: true });
    cy.get(".keyPairGenerateBtn").click();

    cy.get("#generatedPublicKey")
      .invoke("val")
      .then((val) => {
        aliceKeys.publicKey = val;
      });

    cy.get("#generatedPrivateKey")
      .invoke("val")
      .then((val) => {
        aliceKeys.privateKey = val;
      });

    cy.log(aliceKeys);

    cy.get(".keyPairGenerateBtn").click();

    cy.get("#generatedPublicKey")
      .invoke("val")
      .then((val) => {
        bobKeys.publicKey = val;
      });

    cy.get("#generatedPrivateKey")
      .invoke("val")
      .then((val) => {
        bobKeys.privateKey = val;
      });

    cy.log(bobKeys);
    cy.get("#closeGenBtn").click({ force: true });

    cy.wait(500);

    cy.get("#public-key-input")
      .click({ force: true })
      .then(() => {
        cy.focused().type(bobKeys.publicKey, { parseSpecialCharSequences: false });
      });

    cy.get("#private-key-input")
      .click({ force: true })
      .then(() => {
        cy.focused().type(aliceKeys.privateKey, { parseSpecialCharSequences: false });
      });

    cy.get(".submitKeys").click({ force: true });

    cy.wait(500);
    downloadCurrentFile(".downloadFile");
    cy.wait(2500);
  });

  it("verify the encrypted file path", () => {
    const encryptedFile = path.join(downloadsFolder, "document.txt.enc");
    cy.readFile(encryptedFile).should("exist");
  });

  it("loads a file and decrypt using the sender public key and the recepient private key", () => {
    cy.visit(`${Cypress.config("baseUrl")}/?tab=decryption`);
    cy.wait(2500);

    cy.contains("Choose files to decrypt");
    cy.get(".submitFileDec").should("be.disabled");
    cy.get("#dec-file").selectFile(
      path.join(downloadsFolder, "document.txt.enc"),
      { force: true },
    );
    cy.get(".submitFileDec").click({ force: true });
    cy.wait(500);

    cy.contains("Enter sender's Public key and your Private Key");
    cy.get(".submitKeysDec").should("be.disabled");
    cy.wait(500);

    cy.get("#public-key-input-dec")
      .click({ force: true })
      .then(() => {
        cy.focused().type(aliceKeys.publicKey, { parseSpecialCharSequences: false });
      });

    cy.get("#private-key-input-dec")
      .click({ force: true })
      .then(() => {
        cy.focused().type(bobKeys.privateKey, { parseSpecialCharSequences: false });
      });

    cy.get(".submitKeysDec").click({ force: true });

    cy.wait(500);
    downloadCurrentFile(".downloadFileDec");
    cy.wait(5000);
  });

  it("verify the decrypted file path", () => {
    const decryptedFile = path.join(downloadsFolder, "document.txt");
    cy.readFile(decryptedFile).should("exist");
  });

  it("cleans downloads folder", () => {
    cy.task("deleteFolder", downloadsFolder);
  });
});
