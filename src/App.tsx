import { createHashRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import { PhotoBookPage } from "./pages/PhotoBookPage";
import { ChartTest } from "./pages/ChartTest";

function App() {
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
    <div style={{ flexGrow: 1 }}>
      <main>
        <RouterProvider router={router} />
      </main>
    </div>
  );
}

export default App;
