import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  CssBaseline,
} from "@mui/material";
import { makeStyles } from "@material-ui/styles";
import { PhotoBookPage } from "./pages/PhotoBookPage";
import { ChartTest } from "./pages/ChartTest";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  header: {},
  title: {
    flexGrow: 1,
  },
  main: {},
  footer: {
    padding: 4,
  },
}));

function App() {
  const classes = useStyles();
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/families/:famGrampsId/book/",
      element: <PhotoBookPage />,
    },
    {
      path: "/test",
      element: <ChartTest />,
    },
  ]);

  return (
    <div className={classes.root}>
      <main>
        <RouterProvider router={router} />
      </main>
      {/* <footer className={classes.footer}>
        <Typography variant="h6" align="center" gutterBottom>
          Footer
        </Typography>
        <Typography variant="subtitle1" align="center" color="textSecondary" component="p">
          Something here to give the footer a purpose!
        </Typography>
      </footer> */}
    </div>
  );
}

export default App;
