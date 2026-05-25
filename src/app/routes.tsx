import { createBrowserRouter } from "react-router";
import { Home } from "./components/Home";
import { Response } from "./components/Response";
import { Training } from "./components/Training";
import { CategoryDashboard } from "./components/CategoryDashboard";
import { CategoryPractice } from "./components/CategoryPractice";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/response",
    Component: Response,
  },
  {
    path: "/training",
    Component: Training,
  },
  {
    path: "/category-dashboard",
    Component: CategoryDashboard,
  },
  {
    path: "/category/:categoryId",
    Component: CategoryPractice,
  },
]);
