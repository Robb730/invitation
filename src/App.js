import {createBrowserRouter, RouterProvider} from 'react-router-dom'
import Login from './components/pages/Login'
import SignUp from './components/pages/SignUp'
import NotFound from './components/pages/NotFound'
import Homepage from './components/pages/Homepage'
import HostPage from './components/pages/HostPage'
import ProtectedRoute from './components/pages/ProtectedRoute'
import HostSignUp from './components/pages/HostSignUp'

function App() {
  const router = createBrowserRouter([
    {path: "/", element: <Homepage/>},
    {path: "/hostpage", element: <HostPage/>},
    {path: "/login", element: <Login/>},
    {path: "/signup", element: <SignUp/>},
    {path: "/becomehost", element: <HostSignUp/>},
    {path: "*", element: <NotFound/>},
    {path: "/protected", element: <ProtectedRoute><Homepage/></ProtectedRoute>}
  ]);
  return (
    <>
      <RouterProvider router={router}/>
    </>
  );
}

export default App;
