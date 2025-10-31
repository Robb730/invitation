import {createBrowserRouter, RouterProvider} from 'react-router-dom'
import Login from './components/pages/Login'
import SignUp from './components/pages/SignUp'
import NotFound from './components/pages/NotFound'
import Homepage from './components/pages/Homepage'
import HostPage from './components/pages/HostPage'
import ProtectedRoute from './components/pages/ProtectedRoute'
import HostSignUp from './components/pages/HostSignUp'
import Verified from './components/Verified'
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import ListingDetails from './components/pages/ListingDetails';
import GuestReservations from './components/pages/GuestReservations'
import FavoritesPage from './components/pages/FavoritesPage'
import GuestProfile from './components/pages/GuestProfile'

function App() {
  const router = createBrowserRouter([
    { path: "/", element: <Homepage />
        
          
        
      
    },
    { path: "/hostpage", element: (
        <ProtectedRoute allowedRoles={["host", "both"]}>
          <HostPage />
        </ProtectedRoute>
      )
    },
    { path: "/login", element: <Login /> },
    { path: "/signup", element: <SignUp /> },
    { path: "/becomehost", element: <HostSignUp /> },
    { path: "/reservations", element: <GuestReservations /> },
    { path: "/favorites", element: <FavoritesPage /> },
    { path: "/profile", element: <GuestProfile /> },
    { path: "/verified", element: <Verified /> },
    { path: "/room/:id", element: <ListingDetails /> },
    { path: "*", element: <NotFound /> },
  ]);

  return (
    <PayPalScriptProvider options={{ "client-id": "AVOE8rOmi0NKq68uIC51xVdcTFzxDptRhJu9GL10VQdPnTf2t32Eo2i9E8ZTp8sAxRRpX3arJAoAa5N2", currency: "PHP" }}>
      <RouterProvider router={router}/>
    </PayPalScriptProvider>
  );
}

export default App;
