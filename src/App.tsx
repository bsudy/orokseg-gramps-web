import { createHashRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
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
  const router = createHashRouter([
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
    </div>
  );
}

export default App;
