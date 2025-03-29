import React from "react";
import { Typography, Container, Button, Box } from "@mui/material";
import { makeStyles } from "@material-ui/styles";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: 2,
  },
  title: {
    flexGrow: 1,
  },
  heroContent: {
    padding: "64px 0",
  },
  heroButtons: {
    marginTop: 32,
  },
  logo: {
    maxWidth: 200,
    margin: "0 auto 24px",
    display: "block",
  },
  footer: {
    padding: 32,
  },
}));

export default function Home() {
  const classes = useStyles();

  return (
    <>
      <div className={classes.heroContent}>
        <Container maxWidth="sm">
          <Box display="flex" flexDirection="column" alignItems="center">
            <img src="/ logo.png" alt="Örökség Logo" className={classes.logo} />
            <Typography
              component="h1"
              variant="h2"
              align="center"
              color="textPrimary"
              gutterBottom
            >
              Örökség
            </Typography>
            <Typography
              variant="h5"
              align="center"
              color="textSecondary"
              paragraph
            >
              Explore your family heritage and history
            </Typography>
            <div className={classes.heroButtons}>
              <Button 
                variant="contained" 
                color="primary"
                component={Link}
                to="/families/default/book/"
              >
                View Family Book
              </Button>
            </div>
          </Box>
        </Container>
      </div>
    </>
  );
};
