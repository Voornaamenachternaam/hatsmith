/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import { getTranslations as t } from "../../locales";
import Box from "@mui/material/Box";

export default function Footer() {
  const cryptoAddrs = [
    {
      type: "monero",
      alt: "xmr",
      addr: "84zQq4Xt7sq8cmGryuvWsXFMDvBvHjWjnMQXZWQQRXjB1TgoZWS9zBdNcYL7CRbQBqcDdxr4RtcvCgApmQcU6SemVXd7RuG",
    },
    {
      type: "bitcoin",
      alt: "btc",
      addr: "bc1qlfnq8nu2k84h3jth7a27khaq0p2l2gvtyl2dv6",
    },
    {
      type: "ethereum",
      alt: "eth",
      addr: "0xF6F204B044CC73Fa90d7A7e4C5EC2947b83b917e",
    },
  ];

  useEffect(() => {
    // Keep empty or restore donation logic if needed,
    // but the current file had most of it commented out.
  }, []);

  return (
    <Box sx={{ marginTop: "auto" }}>
      <Box
        component="footer"
        sx={{
          textAlign: "center",
          color: (theme) => theme.palette.custom?.diamondBlack?.main || "rgba(0, 0, 0, 0.54)",
          padding: (theme) => theme.spacing(3, 2),
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body1">
            Maintained by {" "}
            <Link
              href="https://github.com/mrtechtroid"
              target="_blank"
              rel="noopener"
              color="inherit"
            >
              {"mrtechtroid"}
            </Link>
          </Typography>
          <Typography variant="body1">
            Hatsmith is a fork of{" "}
            <Link
              href="https://github.com/sh-dv/hat.sh"
              target="_blank"
              rel="noopener"
              color="inherit"
            >
              {"hat.sh"}
            </Link>
            {" "}by {" "}
            <Link
              href="https://github.com/sh-dv"
              target="_blank"
              rel="noopener"
              color="inherit"
            >
              {"sh-dv"}
            </Link>
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
