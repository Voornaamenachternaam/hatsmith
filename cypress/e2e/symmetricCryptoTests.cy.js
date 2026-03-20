/// <reference types="cypress" />
// The app has to be running in dev mode
// Tests are done on chrome
// Avoid running all test files at the same time

import { currentVersion } from "../../src/config/Constants";
import "cypress-real-events/support";

const path = require("path");
const downloadsFolder = Cypress.config("downloadsFolder");
const documentFixture = {
  contents: Cypress.Buffer.from("This is a Hatsmith Cypress test document.\n", "utf8"),
  fileName: "document.txt",
  mimeType: "text/plain",
  lastModified: Date.now(),
};

let encryptionPassword;

const downloadCurrentFile = (selector) => {
  cy.window().document().then((doc) => {
    doc.addEventListener(
      "click",
      () => {
        setTimeout(() => {
          doc.location.reload();
        }, 2500);
      },
      { once: true },
    );

    cy.intercept("/", (req) => {
      req.reply((res) => {
        expect(res.statusCode).to.equal(200);
      });
    });

    cy.get(selector).realClick();
  });
};

describe("Symmetric encryption test", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.contains("Hatsmith");
    cy.contains(currentVersion);
  });

  it("loads a file and encrypt", () => {
    cy.wait(2500);
    cy.contains("Choose files to encrypt");
    cy.get(".submitFile").should("be.disabled");
    cy.get("#enc-file").selectFile(documentFixture, { force: true });
    cy.get(".submitFile").realClick();

    cy.wait(500);
    cy.contains("Choose a strong Password");
    cy.get(".submitKeys").should("be.disabled");
    cy.get(".generatePasswordBtn").realClick();
    cy.get("#encPasswordInput")
      .invoke("val")
      .then((val) => {
        encryptionPassword = val;
        cy.log(encryptionPassword);
      });
    cy.get(".submitKeys").realClick();

    cy.wait(500);
    downloadCurrentFile(".downloadFile");
    cy.wait(2500);
  });

  it("verify the encrypted file path", () => {
    const encryptedFile = path.join(downloadsFolder, "document.txt.enc");
    cy.readFile(encryptedFile).should("exist");
  });

  it("loads a file and decrypt", () => {
    cy.visit(`${Cypress.config("baseUrl")}/?tab=decryption`);
    cy.wait(2500);

    cy.contains("Choose files to decrypt");
    cy.get(".submitFileDec").should("be.disabled");
    cy.get("#dec-file").selectFile(
      path.join(downloadsFolder, "document.txt.enc"),
      { force: true },
    );
    cy.get(".submitFileDec").realClick();
    cy.wait(500);

    cy.contains("Enter the decryption password");
    cy.get(".submitKeysDec").should("be.disabled");
    cy.get(".decPasswordInput").realClick();
    cy.realType(encryptionPassword);
    cy.get(".submitKeysDec").realClick();

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
